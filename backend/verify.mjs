import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { sql } from './menu.mjs'

const origin = process.env.APP_URL || 'http://127.0.0.1:4173'

async function request(path, signal = AbortSignal.timeout(15000)) {
  const response = await fetch(new URL(path, origin), { signal })
  assert.ok(response.ok, `${path} returned HTTP ${response.status}`)
  return response
}

const page = await request('/menu')
assert.match(await page.text(), /<div id="app"><\/div>/)
console.log('App: GET /menu served the production Vue build.')

const items = await (await request('/api/menu')).json()
for (const id of ['chicken-tagine', 'mint-tea']) {
  const item = items.find((row) => row.id === id)
  assert.ok(item, `Postgres menu is missing ${id}`)
  assert.equal(typeof item.priceMinor, 'number')
  assert.equal(typeof item.isAvailable, 'boolean')
}
console.log(`Postgres: GET /api/menu returned ${items.length} dishes with prices and availability.`)

try {
  const download = await request('/api/menu/download')
  assert.match(download.headers.get('content-disposition') ?? '', /restaurant-menu\.txt/)
  const text = await download.text()
  assert.match(text, /Restaurant App Menu/)
  assert.match(text, /Chicken Tagine/)
  console.log('Object Storage: downloaded restaurant-menu.txt through the app and verified its contents.')
} catch (error) {
  console.error(`Object Storage: FAIL — ${error.message}`)
  process.exitCode = 1
}

try {
  await verifyRealtime()
} catch (error) {
  console.error(`Realtime: FAIL — ${error.message}`)
  process.exitCode = 1
}

async function verifyRealtime() {
  const signal = AbortSignal.timeout(35000)
  const live = await request('/api/menu/live', signal)
  assert.match(live.headers.get('content-type') ?? '', /text\/event-stream/)
  const stream = live.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''

  async function waitForMenu(matches) {
    for (;;) {
      const end = buffer.indexOf('\n\n')
      if (end !== -1) {
        const message = buffer.slice(0, end)
        buffer = buffer.slice(end + 2)
        const data = message.split('\n').find((line) => line.startsWith('data: '))
        if (message.includes('event: menu') && data && matches(JSON.parse(data.slice(6)))) return
        continue
      }

      const { done, value } = await stream.read()
      assert.ok(!done, 'Realtime stream ended before the expected menu update.')
      buffer += value
    }
  }

  const probeId = `neon-verify-${randomUUID()}`
  let inserted = false
  try {
    await waitForMenu((rows) => rows.some((row) => row.id === 'chicken-tagine'))
    console.log('Realtime: received the initial menu snapshot through the app.')

    await sql`
      INSERT INTO public.menu_items (id, name, description, price_minor, is_available)
      VALUES (${probeId}, 'Neon verification', 'Temporary verification row.', 0, false)
    `
    inserted = true
    await waitForMenu((rows) => rows.some((row) => row.id === probeId))
    console.log('Realtime: received the new Postgres row without refreshing.')

    await sql`DELETE FROM public.menu_items WHERE id = ${probeId}`
    inserted = false
    await waitForMenu((rows) => !rows.some((row) => row.id === probeId))
    console.log('Realtime: received the removal and confirmed the temporary row was cleaned up.')
  } finally {
    if (inserted) {
      await sql`DELETE FROM public.menu_items WHERE id = ${probeId}`
    }
    await stream.cancel().catch(() => {})
  }
}
