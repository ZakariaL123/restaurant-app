import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { app, realtime } from './app.mjs'

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
