import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Hono } from 'hono'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { isStoredDishPhoto, registerDishPhotoRoutes } from './dish-photos.mjs'
import { createStaffGuard } from './staff-auth.mjs'

test('staff can upload a JPEG and customers can read only a dish-photo path', async () => {
  const issuer = 'https://auth.example.test'
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', { extractable: true })
  const keySet = createLocalJWKSet({ keys: [await exportJWK(publicKey)] })
  const requireStaff = createStaffGuard({ authUrl: issuer, keySet, staffIds: 'staff', managerIds: '' })
  function sign(subject) {
    return new SignJWT({}).setProtectedHeader({ alg: 'EdDSA' }).setIssuer(issuer).setAudience(issuer)
      .setSubject(subject).setExpirationTime('10m').sign(privateKey)
  }
  const [staff, customer] = await Promise.all([sign('staff'), sign('customer')])
  const objects = new Map()
  const app = new Hono()
  registerDishPhotoRoutes(app, {
    requireStaff,
    saveDishPhoto: async (name, bytes) => objects.set(name, bytes),
    readDishPhoto: async (name) => objects.get(name),
  })
  const sample = Uint8Array.from([0xff, 0xd8, 0xff, 0x01, 0xff, 0xd9])
  function upload(token, bytes = sample) {
    const headers = { 'Content-Type': 'image/jpeg' }
    if (token) headers.Authorization = `Bearer ${token}`
    return app.request('/api/staff/menu/photos', { method: 'POST', headers, body: bytes })
  }
  assert.equal((await upload()).status, 401)
  assert.equal((await upload(customer)).status, 403)
  assert.equal((await upload(staff, '<html>not a photo</html>')).status, 415)
  assert.equal((await upload(staff, new Uint8Array(5 * 1024 * 1024 + 1))).status, 413)
  assert.equal(objects.size, 0)
  const uploaded = await upload(staff)
  assert.equal(uploaded.status, 201)
  const { imageUrl } = await uploaded.json()
  assert.ok(isStoredDishPhoto(imageUrl))
  const photo = await app.request(imageUrl)
  assert.equal(photo.status, 200)
  assert.equal(photo.headers.get('Content-Type'), 'image/jpeg')
  assert.deepEqual(new Uint8Array(await photo.arrayBuffer()), sample)
  assert.equal((await app.request('/api/menu/photos/restaurant-menu.txt')).status, 404)
})
