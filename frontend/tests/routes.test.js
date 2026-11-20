import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createPinia } from 'pinia'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory } from 'vue-router'
import menuItems from '../../backend/menu-seed.json' with { type: 'json' }

let vite
let App
let createAppRouter
let useCartStore

before(async () => {
  vite = await createServer({ server: { middlewareMode: true, ws: false } })
  const [appModule, routerModule, cartModule] = await Promise.all([
    vite.ssrLoadModule('/src/App.vue'),
    vite.ssrLoadModule('/src/router/index.ts'),
    vite.ssrLoadModule('/src/stores/cart.ts'),
  ])
  App = appModule.default
  createAppRouter = routerModule.createAppRouter
  useCartStore = cartModule.useCartStore
})

after(async () => {
  await vite?.close()
})

async function renderRoute(path, pinia = createPinia()) {
  const router = createAppRouter(createMemoryHistory())
  const app = createSSRApp(App).use(pinia).use(router)
  await router.push(path)
  return renderToString(app)
}

test('the home page links to the menu', async () => {
  const html = await renderRoute('/')

  assert.match(html, /<h1[^>]*>[\s\S]*?Moroccan[\s\S]*?Bold flavour\.[\s\S]*?<\/h1>/)
  assert.match(html, /<a\b[^>]*href="\/menu"[^>]*>Explore the menu<\/a>/)
  assert.match(html, /<a\b[^>]*href="\/#our-story"[^>]*>\s*Our story\s*<\/a>/)
})

test('the menu shows a loading state before fetching dishes from the backend', async () => {
  const html = await renderRoute('/menu')
  assert.match(html, /role="status"[^>]*>Loading the menu/)
  assert.doesNotMatch(html, /<article\b/)
})

test('the cart combines dishes and updates its total as quantities change', async () => {
  const pinia = createPinia()
  const cart = useCartStore(pinia)
  const chicken = menuItems.find((item) => item.id === 'chicken-tagine')
  const tea = menuItems.find((item) => item.id === 'mint-tea')
  assert.ok(chicken && tea)

  cart.addItem(chicken)
  cart.addItem(chicken)
  cart.addItem(tea)

  const fullCart = await renderRoute('/cart', pinia)
  assert.match(fullCart, /Cart \(2\)/)
  assert.match(fullCart, /MAD\s*65\.00 each/)
  assert.match(fullCart, /<span\b[^>]*>2<\/span>/)
  assert.match(fullCart, /Total<\/strong>\s*<strong\b[^>]*>MAD\s*130\.00<\/strong>/)
  assert.doesNotMatch(fullCart, /Moroccan Mint Tea/)

  cart.changeQuantity(chicken.id, -1)
  cart.changeQuantity(chicken.id, -1)
  const reducedCart = await renderRoute('/cart', pinia)
  assert.match(reducedCart, /Cart \(1\)/)
  assert.match(reducedCart, /Total<\/strong>\s*<strong\b[^>]*>MAD\s*65\.00<\/strong>/)
  assert.match(reducedCart, /aria-label="Decrease quantity of Chicken Tagine"[^>]*\bdisabled\b/)

  cart.changeQuantity(chicken.id, 1)
  assert.equal(cart.itemCount, 2)
  assert.equal(cart.totalMinor, 13000)

  cart.removeItem(chicken.id)
  const emptyCart = await renderRoute('/cart', pinia)
  assert.match(emptyCart, /Cart \(0\)/)
  assert.match(emptyCart, /Your cart is empty/)
})

test('an unknown nested URL shows a 404 page with a link home', async () => {
  const html = await renderRoute('/missing/page?from=menu')

  assert.match(html, /<h1[^>]*>Page not found<\/h1>/)
  assert.match(html, /<a\b[^>]*href="\/"[^>]*>Back to home<\/a>/)
})

test('signed-out visitors cannot see staff orders', async () => {
  const html = await renderRoute('/staff/orders')
  assert.match(html, /<h1[^>]*>Sign in<\/h1>/)
  assert.doesNotMatch(html, /href="\/staff\/orders"/)
  assert.doesNotMatch(html, /role="group"[^>]*aria-label="Sign in"/)
})

test('My orders takes signed-out visitors to the shared sign-in page', async () => {
  const html = await renderRoute('/my-orders')
  assert.match(html, /<h1[^>]*>Sign in<\/h1>/)
  assert.match(html, /href="\/my-orders"[^>]*>My orders<\/a>/)
})

test('the current language translates the customer and sign-in pages', async () => {
  const { setLanguage } = await vite.ssrLoadModule('/src/i18n.ts')
  try {
    setLanguage('fr')
    assert.match(await renderRoute('/'), /Saveurs intenses\./)
    setLanguage('ar')
    assert.match(await renderRoute('/cart'), /سلتك فارغة/)
    assert.match(await renderRoute('/sign-in'), /تسجيل الدخول/)
  } finally {
    setLanguage('en')
  }
})
