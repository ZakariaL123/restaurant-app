import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Hono } from 'hono'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { createAccountGuard, createStaffGuard } from './staff-auth.mjs'
import { registerStaffInvites } from './staff-invites.mjs'

test('a manager can invite and revoke staff without changing their sign-in', async () => {
  const issuer = 'https://auth.example.test'
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', { extractable: true })
  const keySet = createLocalJWKSet({ keys: [await exportJWK(publicKey)] })
  const requireAccount = createAccountGuard({ authUrl: issuer, keySet })
  const guard = { requireAccount, managerIds: 'manager', staffIds: '' }
  const requireManager = createStaffGuard({ ...guard, managerOnly: true })
  const app = new Hono()
  let invite
  registerStaffInvites(app, {
    requireAccount,
    requireManager,
    staffAccess: {
      listStaffAccess: async () => [],
      saveStaffInvite: async (email, digest) => {
        invite = { email, digest }
        return true
      },
      acceptStaffInvite: async (userId, digest) => {
        if (userId !== 'staff' || invite?.digest !== digest || invite.email !== 'staff@example.test') {
          return false
        }
        invite = { email: invite.email, userId }
        return true
      },
      removeStaffAccess: async (email) => {
        if (invite?.email === email) invite = undefined
      },
    },
  })
  const requireStaff = createStaffGuard({ ...guard, isStaff: async (id) => invite?.userId === id })
  app.get('/staff', requireStaff, (context) => context.text(context.get('restaurantRole')))

  const sign = (subject) => new SignJWT({})
    .setProtectedHeader({ alg: 'EdDSA' })
    .setSubject(subject)
    .setIssuer(issuer)
    .setAudience(issuer)
    .setExpirationTime('15m')
    .sign(privateKey)
  const [manager, staff, customer] = await Promise.all(['manager', 'staff', 'customer'].map(sign))

  function request(path, bearer, method = 'GET', body) {
    const headers = { 'Content-Type': 'application/json' }
    if (bearer) headers.Authorization = `Bearer ${bearer}`
    return app.request(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  }

  const manage = '/api/manager/staff'
  const accept = '/api/staff/invites/accept'
  const email = 'Staff@example.test'
  assert.equal((await request('/staff', manager)).status, 200)
  assert.equal((await request('/staff', staff)).status, 403)
  assert.equal((await request(manage, customer, 'POST', { email })).status, 403)
  const issued = await request(manage, manager, 'POST', { email })
  assert.equal(issued.status, 201)
  const { token } = await issued.json()
  assert.notEqual(token, invite.digest)
  assert.equal((await request(accept, undefined, 'POST', { token })).status, 401)
  assert.equal((await request(accept, customer, 'POST', { token })).status, 403)
  assert.equal((await request(accept, staff, 'POST', { token })).status, 204)
  assert.equal((await request(accept, staff, 'POST', { token })).status, 403)
  const allowed = await request('/staff', staff)
  assert.equal(allowed.status, 200)
  assert.equal(await allowed.text(), 'staff')
  assert.equal((await request(manage, staff)).status, 403)
  assert.equal((await request(manage, staff, 'DELETE', { email })).status, 403)
  assert.equal((await request(manage, manager, 'DELETE', { email })).status, 204)
  assert.equal((await request('/staff', staff)).status, 403)
})
