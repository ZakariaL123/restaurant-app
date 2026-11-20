import { createRemoteJWKSet, jwtVerify } from 'jose'

export function createAccountGuard({
  authUrl = process.env.NEON_AUTH_BASE_URL,
  keySet,
} = {}) {
  const base = authUrl?.trim().replace(/\/+$/, '')
  const issuer = base ? new URL(base).origin : null
  const keys = keySet ?? (base ? createRemoteJWKSet(new URL(base + '/.well-known/jwks.json')) : null)
  return async (context, next) => {
    context.header('Cache-Control', 'no-store')
    const token = /^Bearer (\S+)$/i.exec(context.req.header('Authorization') ?? '')?.[1]
    if (!token) return context.json({ error: 'Sign in to continue.' }, 401)
    if (!keys || !issuer) return context.json({ error: 'Staff sign-in is not configured.' }, 503)

    let user
    try {
      const { payload } = await jwtVerify(token, keys, {
        algorithms: ['EdDSA'],
        issuer,
        audience: issuer,
        requiredClaims: ['exp', 'sub'],
      })
      user = payload
    } catch {
      return context.json({ error: 'Invalid or expired sign-in.' }, 401)
    }

    if (user.banned === true) return context.json({ error: 'Account access is blocked.' }, 403)
    context.set('userId', user.sub)
    return next()
  }
}

function idsFrom(value) {
  return new Set((value ?? '').split(',').map((id) => id.trim()).filter(Boolean))
}

export function createStaffGuard({
  staffIds = process.env.STAFF_USER_IDS,
  managerIds = process.env.MANAGER_USER_IDS,
  isStaff = async () => false,
  managerOnly = false,
  requireAccount = createAccountGuard(),
  authUrl,
  keySet,
} = {}) {
  const authenticate = authUrl || keySet ? createAccountGuard({ authUrl, keySet }) : requireAccount
  const staff = idsFrom(staffIds)
  const managers = idsFrom(managerIds)

  return (context, next) => authenticate(context, async () => {
    const id = context.get('userId')
    if (managers.has(id)) {
      context.set('restaurantRole', 'manager')
      return await next()
    }
    if (managerOnly) return context.json({ error: 'Manager access is required.' }, 403)
    if (!staff.has(id) && !(await isStaff(id))) {
      return context.json({ error: 'Staff access is required.' }, 403)
    }
    context.set('restaurantRole', 'staff')
    await next()
  })
}
