import { sql } from './menu.mjs'

export async function hasStaffAccess(id) {
  const [row] = await sql`SELECT 1 FROM public.restaurant_staff WHERE user_id = ${id}`
  return Boolean(row)
}

export function listStaffAccess() {
  return sql`
    SELECT email,
      CASE WHEN user_id IS NOT NULL THEN 'active'
           WHEN expires_at <= now() THEN 'expired'
           ELSE 'pending' END AS status
    FROM public.restaurant_staff
    ORDER BY email
  `
}

export async function saveStaffInvite(email, digest) {
  const [row] = await sql`
    INSERT INTO public.restaurant_staff (email, invite_digest, expires_at)
    VALUES (${email}, ${digest}, now() + interval '1 day')
    ON CONFLICT (email) DO UPDATE
      SET invite_digest = EXCLUDED.invite_digest, expires_at = EXCLUDED.expires_at
      WHERE restaurant_staff.user_id IS NULL
    RETURNING email
  `
  return Boolean(row)
}

export async function acceptStaffInvite(userId, digest) {
  const [row] = await sql`
    UPDATE public.restaurant_staff AS staff
    SET user_id = ${userId}, invite_digest = NULL, expires_at = NULL
    FROM neon_auth."user" AS account
    WHERE account.id::text = ${userId}
      AND lower(account.email) = staff.email
      AND staff.invite_digest = ${digest}
      AND staff.expires_at > now()
      AND staff.user_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.restaurant_staff WHERE user_id = ${userId})
    RETURNING staff.email
  `
  return Boolean(row)
}

export async function removeStaffAccess(email) {
  await sql`DELETE FROM public.restaurant_staff WHERE email = ${email}`
}
