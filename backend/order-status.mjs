import { bodyLimit } from 'hono/body-limit'

const orderIdPattern = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i

export function registerOrderStatusRoute(app, { requireStaff, updateOrderStatus }) {
  app.patch('/api/orders/:id/status', requireStaff, bodyLimit({ maxSize: 1024 }), async (context) => {
    const id = context.req.param('id')
    const body = await context.req.json().catch(() => null)
    const status = body?.status
    if (!orderIdPattern.test(id) || (status !== 'working' && status !== 'done')) {
      return context.json({ error: 'Send an order ID and a supported order status.' }, 400)
    }

    const order = await updateOrderStatus(id, status)
    return order ? context.json(order) : context.json({ error: 'Order not found.' }, 404)
  })
}
