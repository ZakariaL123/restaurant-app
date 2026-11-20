import { randomUUID } from 'node:crypto'
import { bodyLimit } from 'hono/body-limit'

const photoRoute = '/api/menu/photos/'
const photoName = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.jpg$/

export function dishPhotoUrl(filename) {
  return photoRoute + filename
}

export function isStoredDishPhoto(path) {
  return path.startsWith(photoRoute) && photoName.test(path.slice(photoRoute.length))
}

function isJpeg(bytes) {
  return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9
}

export function registerDishPhotoRoutes(app, { requireStaff, saveDishPhoto, readDishPhoto }) {
  const limit = bodyLimit({ maxSize: 5 * 1024 * 1024 })

  app.post('/api/staff/menu/photos', requireStaff, limit, async (context) => {
    const contentType = context.req.header('Content-Type')?.split(';')[0]?.toLowerCase()
    if (contentType !== 'image/jpeg') return context.json({ error: 'Send a JPEG photo.' }, 415)

    const photo = new Uint8Array(await context.req.arrayBuffer())
    if (!isJpeg(photo)) return context.json({ error: 'Send a JPEG photo.' }, 415)

    const filename = `${randomUUID()}.jpg`
    await saveDishPhoto(filename, photo)
    return context.json({ imageUrl: dishPhotoUrl(filename) }, 201)
  })

  app.get(`${photoRoute}:filename`, async (context) => {
    const filename = context.req.param('filename')
    if (!photoName.test(filename)) return context.notFound()
    const body = await readDishPhoto(filename)
    if (!body) return context.notFound()

    return context.body(body, 200, {
      'Content-Type': 'image/jpeg',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
  })
}
