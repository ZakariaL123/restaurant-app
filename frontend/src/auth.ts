import { createAuthClient } from '@neon/neon-js/auth'
import { BetterAuthVanillaAdapter } from '@neon/neon-js/auth/vanilla/adapters'
import { computed, ref } from 'vue'

const url = import.meta.env.VITE_NEON_AUTH_URL?.trim()
export const auth = url
  ? createAuthClient(url, {
      adapter: BetterAuthVanillaAdapter({ fetchOptions: { credentials: 'include' } }),
    })
  : null

type Access = 'guest' | 'customer' | 'staff' | 'manager' | 'unavailable'
export const access = ref<Access>('guest')
export const canAccessStaff = (role: Access) => role === 'staff' || role === 'manager'
export const isStaff = computed(() => canAccessStaff(access.value))
export const signedIn = computed(() => isStaff.value || access.value === 'customer')
let pending: Promise<Access> | undefined

export async function readToken() {
  const result = await auth?.getSession()
  if (result?.error) throw result.error
  return result?.data?.session.token
}

async function checkAccess(): Promise<Access> {
  try {
    const token = await readToken()
    if (!token) return 'guest'
    const response = await fetch('/api/staff/access', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store',
    })
    if (response.status === 204) {
      return response.headers.get('X-Restaurant-Role') === 'manager' ? 'manager' : 'staff'
    }
    if (response.status === 403) return 'customer'
    if (response.status === 401) return 'guest'
    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}

export function refreshAccess() {
  pending ??= checkAccess()
    .then((result) => (access.value = result))
    .finally(() => {
      pending = undefined
    })
  return pending
}
