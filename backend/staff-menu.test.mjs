import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Hono } from 'hono'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { createStaffGuard } from './staff-auth.mjs'
import { registerStaffMenuRoutes } from './staff-menu.mjs'

test('only approved staff can create dishes and edit their availability', async () => {
  const issuer = 'https://auth.example.test'
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', { extractable: true })
  const keySet = createLocalJWKSet({ keys: [await exportJWK(publicKey)] })
  const requireStaff = createStaffGuard({ authUrl: issuer, staffIds: 'staff', keySet })
  const app = new Hono()
  const dishes = new Map()
  let saves = 0
  registerStaffMenuRoutes(app, {
    requireStaff,
    createDish(dish) {
      const saved = { id: 'new-dish', ...dish }
      dishes.set(saved.id, saved)
      saves++
      return saved
    },
    updateDish(id, dish) {
      if (!dishes.has(id)) return undefined
      const saved = { id, ...dish }
      dishes.set(id, saved)
      saves++
      return saved
    },
  })

  const sign = (subject) =>
    new SignJWT({})
      .setProtectedHeader({ alg: 'EdDSA' })
      .setSubject(subject)
      .setIssuer(issuer)
      .setAudience(issuer)
      .setExpirationTime('15m')
      .sign(privateKey)

  const customer = await sign('customer')
  const staff = await sign('staff')
  const collection = '/api/staff/menu'
  const resource = `${collection}/new-dish`
  const dish = {
    name: ' Almond Briouats ',
    description: 'Pastries with almonds and honey.',
    priceMinor: 2450,
    isAvailable: true,
    imageUrl: 'https://images.example.test/briouats.jpg',
  }

  function write(method, path, token, body = dish) {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    return app.request(path, { method, headers, body: JSON.stringify(body) })
  }

  for (const [method, path] of [['POST', collection], ['PATCH', resource]]) {
    assert.equal((await write(method, path)).status, 401)
    assert.equal((await write(method, path, customer)).status, 403)
  }
  assert.equal((await write('POST', collection, staff, { ...dish, priceMinor: -1 })).status, 400)
  assert.equal(saves, 0)

  const created = await write('POST', collection, staff)
  assert.equal(created.status, 201)
  assert.deepEqual(await created.json(), { ...dish, id: 'new-dish', name: 'Almond Briouats' })

  const edit = { ...dish, priceMinor: 2700, isAvailable: false, imageUrl: null }
  const updated = await write('PATCH', resource, staff, edit)
  assert.equal(updated.status, 200)
  assert.deepEqual(await updated.json(), { ...edit, id: 'new-dish', name: 'Almond Briouats' })
  assert.equal(dishes.get('new-dish').isAvailable, false)
  assert.equal((await write('PATCH', `${collection}/missing`, staff, edit)).status, 404)
  assert.equal(saves, 2)
})
