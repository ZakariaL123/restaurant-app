import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createRealtime, rawSql } from '@neon/realtime/server'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { readDishPhoto, saveDishPhoto } from './dish-photo-store.mjs'
import { registerDishPhotoRoutes } from './dish-photos.mjs'
import { requiredEnv } from './env.mjs'
import { createDish, getMenu, menuQuery, updateDish } from './menu.mjs'
import { registerOrderRoute } from './orders.mjs'
import * as staffAccess from './staff-access-store.mjs'
import { createAccountGuard, createStaffGuard } from './staff-auth.mjs'
import { registerStaffInvites } from './staff-invites.mjs'
import { registerStaffMenuRoutes } from './staff-menu.mjs'
import { downloadMenuFile } from './storage.mjs'

const realtime = createRealtime({
  url: requiredEnv('NEON_REALTIME_URL'),
  secret: requiredEnv('NEON_REALTIME_SECRET'),
  db: decodeURIComponent(new URL(requiredEnv('DATABASE_URL')).pathname.slice(1)),
  logLevel: 'warn',
})

const app = new Hono()

app.onError((error, context) => {
  console.error(`Request failed: ${context.req.path} (${error.name})`)
  return context.json({ error: 'The menu service is temporarily unavailable.' }, 503)
})

app.get('/api/menu', async (context) => {
  context.header('Cache-Control', 'no-store')
  return context.json(await getMenu())
})

app.get('/api/menu/download', async (context) => {
  const file = await downloadMenuFile()
  context.header('Content-Disposition', 'attachment; filename="restaurant-menu.txt"')
  return context.text(file)
})

app.get('/api/menu/live', (context) =>
  streamSSE(context, async (stream) => {
    const { promise: closed, resolve: close } = Promise.withResolvers()
    stream.onAbort(close)

    const subscription = await realtime.subscribe(rawSql(menuQuery))
    if (stream.aborted) {
      subscription.unsubscribe()
      return
    }

    const sendMenu = ({ data, status }) => {
      if (status === 'error') {
        console.warn('Realtime menu subscription ended with an error.')
        close()
      } else if (status === 'live' && data) {
        void stream.writeSSE({ event: 'menu', data: JSON.stringify(data) }).catch(close)
      }
    }

    const stop = subscription.onChange(sendMenu)
    const heartbeat = setInterval(() => {
      void stream.writeSSE({ event: 'heartbeat', data: '' }).catch(close)
    }, 15000)

    try {
      sendMenu(subscription.getSnapshot())
      await closed
    } finally {
      clearInterval(heartbeat)
      stop()
      subscription.unsubscribe()
    }
  }),
)

const requireAccount = createAccountGuard()
const requireStaff = createStaffGuard({ requireAccount, isStaff: staffAccess.hasStaffAccess })
const requireManager = createStaffGuard({ requireAccount, managerOnly: true })
registerOrderRoute(app, { requireStaff, requireAccount })
registerStaffMenuRoutes(app, { createDish, updateDish, requireStaff })
registerDishPhotoRoutes(app, { requireStaff, saveDishPhoto, readDishPhoto })
registerStaffInvites(app, { requireAccount, requireManager, staffAccess })
app.all('/api/*', (context) => context.json({ error: 'Unknown endpoint.' }, 404))
app.use('*', serveStatic({ root: './frontend/dist' }))
app.get('*', serveStatic({ path: './frontend/dist/index.html' }))

const server = serve(
  {
    fetch: app.fetch,
    hostname: process.env.HOST || '127.0.0.1',
    port: Number(process.env.PORT || 4173),
  },
  ({ address, port }) => console.log(`Restaurant App listening at http://${address}:${port}`),
)

function shutdown() {
  realtime.close()
  server.close()
  server.closeAllConnections()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
