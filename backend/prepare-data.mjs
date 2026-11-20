import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'
import { requiredEnv } from './env.mjs'
import { getMenu } from './menu.mjs'
import seedItems from './menu-seed.json' with { type: 'json' }
import { publishMenuFile } from './storage.mjs'

const migration = neon(requiredEnv('DATABASE_URL_UNPOOLED'))
const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
await migration.query(schema)

await migration.transaction(
  seedItems.map(
    ({ id, name, description, priceMinor, isAvailable }) => migration`
      INSERT INTO public.menu_items (id, name, description, price_minor, is_available)
      VALUES (${id}, ${name}, ${description}, ${priceMinor}, ${isAvailable})
      ON CONFLICT (id) DO NOTHING
    `,
  ),
)

const items = await getMenu()
console.log(`Postgres: ${items.length} menu items available to the API.`)

const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'MAD' })
const lines = items.map(({ name, description, priceMinor, isAvailable }) => {
  const availability = isAvailable ? '' : ' (currently unavailable)'
  return `${name} — ${currency.format(priceMinor / 100)}${availability}\n${description}`
})
await publishMenuFile(['Restaurant App Menu', ...lines].join('\n\n') + '\n')
console.log('Object Storage: uploaded menu/restaurant-menu.txt to the private assets bucket.')
