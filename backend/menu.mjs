import { randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { requiredEnv } from './env.mjs'

export const sql = neon(requiredEnv('DATABASE_URL'))

// Both the initial HTTP response and the live stream use this query.
export const menuQuery = `
  SELECT id, name, description, price_minor AS "priceMinor", is_available AS "isAvailable",
         image_url AS "imageUrl"
  FROM public.menu_items
  ORDER BY name, id
`

export function getMenu() {
  return sql.query(menuQuery)
}

export async function createDish({ name, description, priceMinor, isAvailable, imageUrl }) {
  const [dish] = await sql`
    INSERT INTO public.menu_items (id, name, description, price_minor, is_available, image_url)
    VALUES (${randomUUID()}, ${name}, ${description}, ${priceMinor}, ${isAvailable}, ${imageUrl})
    RETURNING id, name, description, price_minor AS "priceMinor", is_available AS "isAvailable",
              image_url AS "imageUrl"
  `
  return dish
}

export async function updateDish(id, { name, description, priceMinor, isAvailable, imageUrl }) {
  const [dish] = await sql`
    UPDATE public.menu_items
    SET name = ${name}, description = ${description}, price_minor = ${priceMinor},
        is_available = ${isAvailable}, image_url = ${imageUrl}
    WHERE id = ${id}
    RETURNING id, name, description, price_minor AS "priceMinor", is_available AS "isAvailable",
              image_url AS "imageUrl"
  `
  return dish
}
