export function registerCustomerOrdersRoute(app, { requireAccount, listCustomerOrders }) {
  app.get('/api/my/orders', requireAccount, async (context) => {
    const customerId = context.get('userId')
    if (!customerId) return context.json({ error: 'Sign in to continue.' }, 401)
    return context.json(await listCustomerOrders(customerId))
  })
}

export function optionalOrderAccount(requireAccount) {
  return (context, next) => {
    if (context.req.header('Authorization') === undefined) return next()
    return requireAccount(context, next)
  }
}
