<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { access, isStaff, readToken } from '../auth'
import OrderDetails from '../components/OrderDetails.vue'
import StaffInviteManager from '../components/StaffInviteManager.vue'
import StaffMenuManager from '../components/StaffMenuManager.vue'
import { useLanguage } from '../i18n'
import { orderStatuses, statusLabel, type Order } from '../types/orders'

const statusActions = ['working', 'done'] as const
type StatusAction = (typeof statusActions)[number]

const router = useRouter()
const { t } = useLanguage()
const orders = ref<Order[]>([])
const sections = computed(() =>
  orderStatuses.map((status) => ({
    status,
    orders: orders.value.filter((order) => order.status === status).slice(0, 50),
  })),
)
const loading = ref(true)
const failed = ref(false)
const savingOrders = ref(new Set<string>())
const orderStatusErrors = ref(new Set<string>())

async function leaveStaff(reason: 'guest' | 'customer') {
  access.value = reason
  await router.replace(
    reason === 'guest' ? { name: 'sign-in', query: { next: 'staff' } } : { name: 'menu' },
  )
}

async function loadOrders() {
  if (savingOrders.value.size) return
  loading.value = true
  failed.value = false
  orders.value = []
  orderStatusErrors.value.clear()
  try {
    const token = await readToken()
    if (!token) return await leaveStaff('guest')
    const response = await fetch('/api/orders', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store',
    })
    if (response.status === 401) return await leaveStaff('guest')
    if (response.status === 403) return await leaveStaff('customer')
    if (!response.ok) throw new Error('Could not load orders')
    orders.value = await response.json()
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

async function setOrderStatus(order: Order, status: StatusAction) {
  if (order.status === status || savingOrders.value.has(order.id)) return
  savingOrders.value.add(order.id)
  orderStatusErrors.value.delete(order.id)
  try {
    const token = await readToken()
    if (!token) return await leaveStaff('guest')
    const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (response.status === 401) return await leaveStaff('guest')
    if (response.status === 403) return await leaveStaff('customer')
    if (!response.ok) throw new Error('Could not update order status')
    const updated: Pick<Order, 'status'> = await response.json()
    order.status = updated.status
  } catch {
    orderStatusErrors.value.add(order.id)
  } finally {
    savingOrders.value.delete(order.id)
  }
}

onMounted(loadOrders)
</script>

<template>
  <main v-if="isStaff" class="page-shell staff-page">
    <section class="page-masthead" aria-labelledby="staff-title">
      <div class="masthead-copy">
        <h1 id="staff-title" class="page-title">{{ t('staff') }}</h1>
      </div>
      <button
        class="button button--outline"
        type="button"
        :disabled="loading || savingOrders.size > 0"
        @click="loadOrders"
      >
        {{ t('refresh') }}
      </button>
    </section>
    <div class="staff-tools">
      <StaffInviteManager v-if="access === 'manager'" />
      <StaffMenuManager @access-lost="leaveStaff" />
    </div>
    <p v-if="loading" role="status">{{ t('loadingOrders') }}</p>
    <p v-else-if="failed" role="alert">{{ t('ordersError') }}</p>
    <template v-else>
      <p class="muted">{{ t('recentPerStatus') }}</p>
      <div class="order-board">
        <section
          v-for="section in sections"
          :key="section.status"
          class="order-column"
          :data-status="section.status"
          :aria-label="t(statusLabel[section.status])"
        >
          <h2>
            {{ t(statusLabel[section.status]) }} <span>{{ section.orders.length }}</span>
          </h2>
          <p v-if="section.orders.length === 0" class="muted">{{ t('noOrders') }}</p>
          <ol v-else class="orders">
            <li v-for="order in section.orders" :key="order.id" class="panel">
              <OrderDetails :order="order" heading="h3" />
              <div class="status-actions" role="group" :aria-label="t('orderStatus')">
                <button
                  v-for="status in statusActions"
                  :key="status"
                  class="button button--outline"
                  type="button"
                  :aria-pressed="order.status === status"
                  :disabled="order.status === status || savingOrders.has(order.id)"
                  @click="setOrderStatus(order, status)"
                >
                  {{ t(statusLabel[status]) }}
                </button>
              </div>
              <p v-if="orderStatusErrors.has(order.id)" role="alert">{{ t('orderStatusError') }}</p>
            </li>
          </ol>
        </section>
      </div>
    </template>
  </main>
</template>

<style scoped>
.staff-tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  align-items: start;
  gap: 14px;
}
.order-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}
.order-column {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--edge);
  border-block-start: 5px solid var(--status-new-ink);
  border-radius: 12px;
  background: var(--paper-toned);
}
.order-column[data-status='working'] {
  border-block-start-color: var(--status-working-ink);
}
.order-column[data-status='done'] {
  border-block-start-color: var(--status-done-ink);
}
.order-column h2 {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  margin-block: 0 12px;
  font-size: 1.125rem;
}
.order-column h2 span {
  min-inline-size: 1.7rem;
  padding: 4px 6px;
  border-radius: 999px;
  text-align: center;
  font-size: 0.78rem;
  background: var(--surface);
}
.orders {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
}
.orders > li {
  padding: 16px;
}
.status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.status-actions button {
  padding: 6px 12px;
  font-size: 0.81rem;
}
@media (max-width: 780px) {
  .order-board {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
