import { createHash, randomBytes } from 'node:crypto'
import { bodyLimit } from 'hono/body-limit'

const invitePattern = /^[A-Za-z0-9_-]{43}$/
const digest = (token) => createHash('sha256').update(token).digest('hex')

function readEmail(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  return email.length <= 254 && /^[^\s@\x00-\x1f]+@[^\s@\x00-\x1f]+\.[^\s@\x00-\x1f]+$/.test(email) ? email : null
}

export function registerStaffInvites(app, { requireAccount, requireManager, staffAccess }) {
  const limit = bodyLimit({ maxSize: 4096 })

  app.get('/api/manager/staff', requireManager, async (context) =>
    context.json(await staffAccess.listStaffAccess()),
  )

  app.post('/api/manager/staff', requireManager, limit, async (context) => {
    const email = readEmail(await context.req.json().catch(() => null))
    if (!email) return context.json({ error: 'Enter a valid email.' }, 400)
    const token = randomBytes(32).toString('base64url')
    if (!(await staffAccess.saveStaffInvite(email, digest(token)))) {
      return context.json({ error: 'This account already has staff access.' }, 409)
    }
    return context.json({ token }, 201)
  })

  app.delete('/api/manager/staff', requireManager, limit, async (context) => {
    const email = readEmail(await context.req.json().catch(() => null))
    if (!email) return context.json({ error: 'Enter a valid email.' }, 400)
    await staffAccess.removeStaffAccess(email)
    return context.body(null, 204)
  })

  app.post('/api/staff/invites/accept', requireAccount, limit, async (context) => {
    const body = await context.req.json().catch(() => null)
    if (typeof body?.token !== 'string' || !invitePattern.test(body.token)) {
      return context.json({ error: 'Invalid invitation.' }, 400)
    }
    if (!(await staffAccess.acceptStaffInvite(context.get('userId'), digest(body.token)))) {
      return context.json({ error: 'Invitation not available for this account.' }, 403)
    }
    return context.body(null, 204)
  })
}
