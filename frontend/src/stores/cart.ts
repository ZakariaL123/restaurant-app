import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { readToken, signedIn } from '../auth'
import type { MenuItem } from '../types/menu'

interface CartItem {
  id: string
  name: string
  priceMinor: number
  quantity: number
}

interface OrderReceipt {
  id: string
  totalMinor: number
  tracked: boolean
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const isPlacingOrder = ref(false)
  const orderReceipt = ref<OrderReceipt | null>(null)
  const orderError = ref<
    '' | 'invalidOrder' | 'unavailableOrder' | 'orderNotConfirmed' | 'checkoutAuthError'
  >('')
  const itemCount = computed(() => items.value.reduce((count, item) => count + item.quantity, 0))
  const totalMinor = computed(() =>
    items.value.reduce((total, item) => total + item.priceMinor * item.quantity, 0),
  )

  function addItem(item: MenuItem) {
    if (!item.isAvailable || isPlacingOrder.value) return

    orderReceipt.value = null
    orderError.value = ''

    const existing = items.value.find((entry) => entry.id === item.id)
    if (existing) {
      existing.quantity += 1
      return
    }

    items.value.push({ id: item.id, name: item.name, priceMinor: item.priceMinor, quantity: 1 })
  }

  function removeItem(id: string) {
    if (isPlacingOrder.value) return

    items.value = items.value.filter((item) => item.id !== id)
  }

  function changeQuantity(id: string, amount: -1 | 1) {
    if (isPlacingOrder.value) return

    const item = items.value.find((entry) => entry.id === id)
    if (!item) return

    item.quantity = Math.max(1, item.quantity + amount)
  }

  async function placeOrder() {
    if (isPlacingOrder.value || items.value.length === 0) return

    isPlacingOrder.value = true
    orderError.value = ''

    try {
      const hadAccount = signedIn.value
      const token = await readToken().catch(() => undefined)
      if (hadAccount && !token) {
        orderError.value = 'checkoutAuthError'
        return
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: items.value.map(({ id, quantity }) => ({ id, quantity })) }),
      })

      if (response.status === 401 || response.status === 403) {
        orderError.value = 'checkoutAuthError'
        return
      }
      if (response.status === 400 || response.status === 409) {
        orderError.value = response.status === 400 ? 'invalidOrder' : 'unavailableOrder'
        return
      }

      if (!response.ok) throw new Error('Order request failed.')

      const receipt: OrderReceipt = await response.json()
      orderReceipt.value = receipt
      items.value = []
    } catch {
      orderError.value = 'orderNotConfirmed'
    } finally {
      isPlacingOrder.value = false
    }
  }

  return {
    items,
    itemCount,
    totalMinor,
    isPlacingOrder,
    orderReceipt,
    orderError,
    addItem,
    removeItem,
    changeQuantity,
    placeOrder,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartStore, import.meta.hot))
}
