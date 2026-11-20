import { bodyLimit } from 'hono/body-limit'
import { isStoredDishPhoto } from './dish-photos.mjs'
import { createStaffGuard } from './staff-auth.mjs'

function isPhotoUrl(value) {
  if (isStoredDishPhoto(value)) return true
  if (/^\/dishes\/[\w.-]+\.(avif|gif|jpe?g|png|webp)$/i.test(value)) return true
  if (!value.startsWith('https://') || /[\s\\]/u.test(value)) return false
  const url = URL.parse(value)
  return url?.protocol === 'https:' && !url.username && !url.password
}

function normalizeDish(body) {
  if (typeof body?.name !== 'string' || typeof body.description !== 'string') return null
  const name = body.name.trim()
  const description = body.description.trim()
  const { priceMinor, isAvailable } = body
  if (
    !name ||
    name.length > 120 ||
    !description ||
    description.length > 2000 ||
    name.includes('\0') ||
    description.includes('\0') ||
    !Number.isInteger(priceMinor) ||
    priceMinor < 0 ||
    priceMinor > 2147483647 ||
    typeof isAvailable !== 'boolean' ||
    (body.imageUrl != null && typeof body.imageUrl !== 'string')
  ) {
    return null
  }

  const imageUrl = body.imageUrl?.trim() || null
  if (imageUrl && (imageUrl.length > 2048 || imageUrl.includes('\0') || !isPhotoUrl(imageUrl))) {
    return null
  }
  return { name, description, priceMinor, isAvailable, imageUrl }
}

export function registerStaffMenuRoutes(
  app,
  { createDish, updateDish, requireStaff = createStaffGuard() },
) {
  const limit = bodyLimit({ maxSize: 16384 })

  app.post('/api/staff/menu', requireStaff, limit, async (context) => {
    const dish = normalizeDish(await context.req.json().catch(() => null))
    if (!dish) return context.json({ error: 'Invalid dish details.' }, 400)
    return context.json(await createDish(dish), 201)
  })

  app.patch('/api/staff/menu/:id', requireStaff, limit, async (context) => {
    const dish = normalizeDish(await context.req.json().catch(() => null))
    if (!dish) return context.json({ error: 'Invalid dish details.' }, 400)
    const updated = await updateDish(context.req.param('id'), dish)
    return updated ? context.json(updated) : context.json({ error: 'Dish not found.' }, 404)
  })
}
