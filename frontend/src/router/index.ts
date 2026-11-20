import { createRouter, type RouterHistory } from 'vue-router'
import { canAccessStaff, refreshAccess } from '../auth'
import CartView from '../views/CartView.vue'
import HomeView from '../views/HomeView.vue'
import MenuView from '../views/MenuView.vue'
import NotFoundView from '../views/NotFoundView.vue'

export function createAppRouter(history: RouterHistory) {
  return createRouter({
    history,
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) return savedPosition
      if (to.hash === '#our-story') return { el: to.hash }
      return { top: 0 }
    },
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/menu', name: 'menu', component: MenuView },
      { path: '/cart', name: 'cart', component: CartView },
      { path: '/sign-in', name: 'sign-in', component: () => import('../views/SignInView.vue') },
      {
        path: '/my-orders',
        name: 'my-orders',
        async beforeEnter() {
          const access = await refreshAccess()
          if (access === 'customer' || canAccessStaff(access)) return true
          return { name: 'sign-in', query: { next: 'orders', reason: access } }
        },
        component: () => import('../views/MyOrdersView.vue'),
      },
      {
        path: '/staff/orders',
        async beforeEnter() {
          const access = await refreshAccess()
          if (canAccessStaff(access)) return true
          if (access === 'customer') return { name: 'menu' }
          return { name: 'sign-in', query: { next: 'staff', reason: access } }
        },
        name: 'staff-orders',
        component: () => import('../views/StaffOrdersView.vue'),
      },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
    ],
  })
}
