<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { signedIn } from '../auth'
import { useLanguage } from '../i18n'
import { dishName } from '../utils/dishText'
import { useCartStore } from '../stores/cart'
import { formatPrice } from '../utils/formatPrice'

const cart = useCartStore()
const { language, t } = useLanguage()
</script>

<template>
  <main class="page-shell cart-page">
    <section class="page-masthead" aria-labelledby="cart-title">
      <div class="masthead-copy">
        <h1 id="cart-title" class="page-title">{{ t('yourCart') }}</h1>
      </div>
      <RouterLink class="button button--outline" :to="{ name: 'menu' }">{{
        t('browse')
      }}</RouterLink>
    </section>

    <div v-if="cart.orderReceipt" class="order-receipt panel" role="status">
      <h2>{{ t('placed') }}</h2>
      <p>
        {{ t('orderId') }}: <bdi>{{ cart.orderReceipt.id }}</bdi>
      </p>
      <p>
        <strong>{{ t('total') }}: {{ formatPrice(cart.orderReceipt.totalMinor, language) }}</strong>
      </p>
      <RouterLink v-if="cart.orderReceipt.tracked" class="button" :to="{ name: 'my-orders' }">
        {{ t('viewMyOrders') }}
      </RouterLink>
    </div>
    <div v-else-if="cart.items.length === 0" class="panel panel-empty">
      <p>{{ t('emptyCart') }}</p>
      <RouterLink class="button" :to="{ name: 'menu' }">{{ t('browse') }}</RouterLink>
    </div>
    <div v-else class="cart-layout">
      <ul class="cart-items">
        <li v-for="item in cart.items" :key="item.id" class="cart-item">
          <div>
            <h2>{{ dishName(item.name, language) }}</h2>
            <p>{{ formatPrice(item.priceMinor, language) }} {{ t('each') }}</p>

            <div
              class="quantity-controls"
              role="group"
              :aria-label="`${t('quantity')} (${dishName(item.name, language)})`"
            >
              <button
                type="button"
                class="button button--outline"
                :aria-label="`${t('decrease')} ${dishName(item.name, language)}`"
                :disabled="cart.isPlacingOrder || item.quantity === 1"
                @click="cart.changeQuantity(item.id, -1)"
              >
                −
              </button>
              <span>{{ item.quantity }}</span>
              <button
                type="button"
                class="button button--outline"
                :aria-label="`${t('increase')} ${dishName(item.name, language)}`"
                :disabled="cart.isPlacingOrder"
                @click="cart.changeQuantity(item.id, 1)"
              >
                +
              </button>
            </div>
          </div>
          <button
            type="button"
            class="button button--outline"
            :aria-label="`${t('remove')} (${dishName(item.name, language)})`"
            :disabled="cart.isPlacingOrder"
            @click="cart.removeItem(item.id)"
          >
            {{ t('remove') }}
          </button>
        </li>
      </ul>
      <aside class="checkout panel" :aria-label="t('total')">
        <p class="checkout-total">
          <strong>{{ t('total') }}</strong>
          <strong>{{ formatPrice(cart.totalMinor, language) }}</strong>
        </p>
        <p v-if="!signedIn || cart.orderError === 'checkoutAuthError'">
          <RouterLink :to="{ name: 'sign-in', query: { next: 'cart' } }">{{
            t('trackOrderSignIn')
          }}</RouterLink>
        </p>
        <button
          class="button button--order"
          type="button"
          :disabled="cart.isPlacingOrder"
          @click="cart.placeOrder()"
        >
          {{ cart.isPlacingOrder ? t('placing') : t('place') }}
        </button>
        <p v-if="cart.orderError" class="order-error" role="alert">
          {{ t(cart.orderError) }}
        </p>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.cart-items {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.cart-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--edge);
  border-radius: 12px;
  background: var(--surface);
}

.cart-item h2 {
  margin: 0 0 4px;
  font-size: 1.25rem;
}

.cart-item p {
  margin: 0;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.quantity-controls button {
  min-inline-size: 44px;
  padding-inline: 0.45rem;
}

.checkout,
.order-receipt {
  padding: clamp(18px, 3vw, 28px);
}

.checkout {
  background: var(--paper-toned);
}

.checkout .button {
  width: 100%;
}

.order-receipt {
  overflow-wrap: anywhere;
}

.order-receipt h2 {
  margin-block-start: 0;
}
.checkout-total {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-block: 0 16px;
}
.checkout-total strong:last-child {
  color: var(--lbaldi-green);
  font-variant-numeric: tabular-nums;
}
.checkout a {
  color: var(--lbaldi-green);
}

.order-error {
  color: var(--error);
}
@media (max-width: 760px) {
  .cart-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
