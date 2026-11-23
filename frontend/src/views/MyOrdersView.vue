<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { access, readToken } from '../auth'
import OrderDetails from '../components/OrderDetails.vue'
import { useLanguage } from '../i18n'
import type { Order } from '../types/orders'

const { t } = useLanguage()
const router = useRouter()
const orders = ref<Order[]>([])
const initial = ref(true)
const loading = ref(false)
const failed = ref(false)
const controller = new AbortController()
let timer: number | undefined

async function goToSignIn() {
  orders.value = []
  access.value = 'guest'
  await router.replace({ name: 'sign-in', query: { next: 'orders' } })
}

async function loadOrders() {
  if (loading.value || controller.signal.aborted) return
  loading.value = true
  try {
    const token = await readToken()
    if (controller.signal.aborted) return
    if (!token) return await goToSignIn()
    const response = await fetch('/api/my/orders', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    })
    if (response.status === 401 || response.status === 403) return await goToSignIn()
    if (!response.ok) throw new Error('Could not load customer orders')
    orders.value = await response.json()
    failed.value = false
  } catch {
    if (!controller.signal.aborted) failed.value = true
  } finally {
    initial.value = false
    loading.value = false
  }
}

onMounted(() => {
  void loadOrders()
  timer = window.setInterval(() => {
    if (
      document.visibilityState === 'visible' &&
      orders.value.some((order) => order.status !== 'done')
    ) {
      void loadOrders()
    }
  }, 15000)
})

onUnmounted(() => {
  controller.abort()
  window.clearInterval(timer)
})
</script>

<template>
  <main class="page-shell my-orders">
    <section class="page-masthead" aria-labelledby="my-orders-title">
      <div class="masthead-copy">
        <h1 id="my-orders-title" class="page-title">{{ t('myOrders') }}</h1>
      </div>
      <button class="button button--outline" type="button" :disabled="loading" @click="loadOrders">
        {{ t('refresh') }}
      </button>
    </section>
    <p v-if="initial" role="status">{{ t('loadingOrders') }}</p>
    <p v-if="failed" role="alert">{{ t('ordersError') }}</p>
    <template v-if="orders.length">
      <p class="muted">{{ t('recent') }}</p>
      <ol class="orders">
        <li v-for="order in orders" :key="order.id" class="panel">
          <OrderDetails :order="order" />
        </li>
      </ol>
    </template>
    <div v-else-if="!initial && !failed" class="panel panel-empty">
      <p>{{ t('myOrdersEmpty') }}</p>
      <RouterLink class="button" :to="{ name: 'menu' }">{{ t('browse') }}</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.my-orders {
  max-width: 56rem;
}
.orders {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 16px;
}
.orders > li {
  padding: clamp(16px, 3vw, 28px);
}
</style>
