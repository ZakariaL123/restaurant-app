import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Hono } from 'hono'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { registerOrderStatusRoute } from './order-status.mjs'
import { createStaffGuard } from './staff-auth.mjs'

test('only staff can move an existing order to working or done', async () => {
  const issuer = 'https://auth.example.test'
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', { extractable: true })
  const keySet = createLocalJWKSet({ keys: [await exportJWK(publicKey)] })
  const requireStaff = createStaffGuard({ authUrl: issuer, keySet, staffIds: 'staff', managerIds: '' })
  const app = new Hono()
  const id = '93f4faa8-bfc2-44fe-b153-e1bb5ba76790'
  let currentStatus = 'new'
  registerOrderStatusRoute(app, {
    requireStaff,
    async updateOrderStatus(orderId, status) {
      if (orderId !== id) return undefined
      currentStatus = status
      return { id, status }
    },
  })

  function sign(subject) {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'EdDSA' })
      .setIssuer(issuer)
      .setAudience(issuer)
      .setSubject(subject)
      .setExpirationTime('10m')
      .sign(privateKey)
  }
  const [staff, customer] = await Promise.all([sign('staff'), sign('customer')])

  function update(status, bearer, orderId = id) {
    const headers = { 'Content-Type': 'application/json' }
    if (bearer) headers.Authorization = `Bearer ${bearer}`
    return app.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    })
  }

  assert.equal((await update('done')).status, 401)
  assert.equal((await update('done', customer)).status, 403)
  assert.equal((await update('ready', staff)).status, 400)
  assert.equal((await update('working', staff, 'not-an-order')).status, 400)
  assert.equal((await update('done', staff, '45e1da76-047c-46ae-8803-7848c148ae0e')).status, 404)
  assert.equal(currentStatus, 'new')

  for (const status of ['working', 'done']) {
    const result = await update(status, staff)
    assert.equal(result.status, 200)
    assert.deepEqual(await result.json(), { id, status })
    assert.equal(currentStatus, status)
  }
})
