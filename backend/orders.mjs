import { bodyLimit } from 'hono/body-limit'
import { optionalOrderAccount, registerCustomerOrdersRoute } from './customer-orders.mjs'
import { sql } from './menu.mjs'
import { registerOrderStatusRoute } from './order-status.mjs'
import { createAccountGuard, createStaffGuard } from './staff-auth.mjs'

const orderDetails = `
  SELECT o.id, o.created_at AS "createdAt", o.total_minor AS "totalMinor", o.status,
    COALESCE((
      SELECT json_agg(json_build_object(
        'id', i.menu_item_id,
        'name', i.item_name,
        'quantity', i.quantity
      ) ORDER BY i.item_name, i.menu_item_id)
      FROM public.order_items AS i
      WHERE i.order_id = o.id
    ), '[]'::json) AS items
  FROM recent AS o
  ORDER BY o.created_at DESC, o.id DESC
`

function listStaffOrders() {
  return sql.query(`
    WITH recent AS (
      SELECT orders.*
      FROM (VALUES ('new'), ('working'), ('done')) AS sections(status)
      CROSS JOIN LATERAL (
        SELECT id, created_at, total_minor, status
        FROM public.orders WHERE status = sections.status
        ORDER BY created_at DESC, id DESC
        LIMIT 50
      ) AS orders
    )
    ${orderDetails}
  `)
}

function listCustomerOrders(customerId) {
  return sql.query(`
    WITH recent AS (
      SELECT id, created_at, total_minor, status
      FROM public.orders WHERE customer_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 50
    )
    ${orderDetails}
  `, [customerId])
}

export async function updateOrderStatus(id, status) {
  const [order] = await sql`
    UPDATE public.orders SET status = ${status}
    WHERE id = ${id}
    RETURNING id, status
  `
  return order
}

export function registerOrderRoute(app, { requireStaff = createStaffGuard(), requireAccount = createAccountGuard() } = {}) {
  registerOrderStatusRoute(app, { requireStaff, updateOrderStatus })
  registerCustomerOrdersRoute(app, { requireAccount, listCustomerOrders })
  app.get('/api/staff/access', requireStaff, (context) => {
    context.header('X-Restaurant-Role', context.get('restaurantRole'))
    return context.body(null, 204)
  })
  app.get('/api/orders', requireStaff, async (context) => context.json(await listStaffOrders()))

  app.post('/api/orders', optionalOrderAccount(requireAccount), bodyLimit({ maxSize: 8192 }), async (context) => {
    const body = await context.req.json().catch(() => null)
    const items = body?.items

    if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
      return context.json({ error: 'Send between 1 and 50 different dishes.' }, 400)
    }

    const valid = items.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        item.id.trim().length > 0 &&
        item.id.length <= 100 &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 99,
    )

    if (!valid || new Set(items.map((item) => item.id)).size !== items.length) {
      return context.json({ error: 'Use one entry per dish with a quantity from 1 to 99.' }, 400)
    }

    const [order] = await sql`
      WITH requested AS (
        SELECT id, quantity
        FROM jsonb_to_recordset(${JSON.stringify(items)}::jsonb)
          AS item(id text, quantity integer)
      ),
      available AS (
        SELECT menu.id, menu.name, menu.price_minor, requested.quantity
        FROM requested
        JOIN public.menu_items AS menu ON menu.id = requested.id
        WHERE menu.is_available
      ),
      new_order AS (
        INSERT INTO public.orders (total_minor, customer_id)
        SELECT SUM(price_minor::bigint * quantity)::integer, ${context.get('userId') ?? null}::text
        FROM available
        HAVING COUNT(*) = (SELECT COUNT(*) FROM requested)
          AND SUM(price_minor::bigint * quantity) <= 2147483647
        RETURNING id, created_at, total_minor, customer_id
      ),
      saved_items AS (
        INSERT INTO public.order_items
          (order_id, menu_item_id, item_name, quantity, unit_price_minor)
        SELECT new_order.id, available.id, available.name,
               available.quantity, available.price_minor
        FROM new_order
        CROSS JOIN available
      )
      SELECT id, created_at AS "createdAt", total_minor AS "totalMinor",
             (customer_id IS NOT NULL) AS tracked
      FROM new_order
    `

    if (!order) {
      return context.json({ error: 'A dish is unavailable or the order total is too large.' }, 409)
    }

    return context.json(order, 201)
  })
}
