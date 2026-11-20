import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Hono } from 'hono'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { optionalOrderAccount, registerCustomerOrdersRoute } from './customer-orders.mjs'
import { createAccountGuard } from './staff-auth.mjs'

test('customer history and checkout use the signed-in account', async () => {
  const issuer = 'https://auth.example.test'
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', { extractable: true })
  const keySet = createLocalJWKSet({ keys: [await exportJWK(publicKey)] })
  const requireAccount = createAccountGuard({ authUrl: issuer, keySet })
  const app = new Hono()
  const orders = [{ id: 'your-order', owner: 'customer-a' }, { id: 'another-order', owner: 'customer-b' }]
  registerCustomerOrdersRoute(app, {
    requireAccount,
    listCustomerOrders: async (id) => orders.filter((order) => order.owner === id).map(({ id }) => ({ id })),
  })
  app.post('/checkout', optionalOrderAccount(requireAccount), (context) =>
    context.json({ account: context.get('userId') ?? null }),
  )
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuer(issuer)
    .setAudience(issuer)
    .setSubject('customer-a')
    .setExpirationTime('10m')
    .sign(privateKey)

  assert.equal((await app.request('/api/my/orders')).status, 401)
  const headers = { Authorization: `Bearer ${token}` }
  const history = await app.request('/api/my/orders?customerId=customer-b', { headers })
  assert.equal(history.headers.get('Cache-Control'), 'no-store')
  assert.deepEqual(await history.json(), [{ id: 'your-order' }])
  assert.deepEqual(await (await app.request('/checkout', { method: 'POST', headers })).json(), { account: 'customer-a' })
  assert.deepEqual(await (await app.request('/checkout', { method: 'POST' })).json(), { account: null })
  assert.equal((await app.request('/checkout', {
    method: 'POST', headers: { Authorization: 'Bearer invalid' },
  })).status, 401)
})
