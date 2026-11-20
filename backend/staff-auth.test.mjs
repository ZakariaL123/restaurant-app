import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Hono } from 'hono'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { createStaffGuard } from './staff-auth.mjs'

test('only an approved user with a valid token can read orders', async () => {
  const issuer = 'https://auth.example.test'
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', { extractable: true })
  const keySet = createLocalJWKSet({ keys: [await exportJWK(publicKey)] })
  const guard = createStaffGuard({ authUrl: issuer + '/neondb/auth', staffIds: 'staff', keySet })
  const app = new Hono()
  let reads = 0
  app.get('/orders', guard, (context) => {
    reads++
    return context.json([{ id: 'sample-order' }])
  })

  function token(subject, { audience = issuer, expiration = '15m', banned = false } = {}) {
    return new SignJWT({ banned })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setSubject(subject)
      .setIssuer(issuer)
      .setAudience(audience)
      .setExpirationTime(expiration)
      .sign(privateKey)
  }

  for (const [value, status] of [
    [undefined, 401],
    ['invalid', 401],
    [await token('staff', { expiration: '-1m' }), 401],
    [await token('staff', { audience: 'https://wrong.example.test' }), 401],
    [await token('customer'), 403],
    [await token('staff', { banned: true }), 403],
    [await token('staff'), 200],
  ]) {
    const headers = value ? { Authorization: `Bearer ${value}` } : {}
    const response = await app.request('/orders', { headers })
    assert.equal(response.status, status)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
  }
  assert.equal(reads, 1)
})
