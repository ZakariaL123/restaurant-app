<script setup lang="ts">
import { computed } from 'vue'
import { localeTags, useLanguage } from '../i18n'
import { statusLabel, type Order } from '../types/orders'
import { dishName } from '../utils/dishText'
import { formatPrice } from '../utils/formatPrice'

const { order, heading = 'h2' } = defineProps<{ order: Order; heading?: 'h2' | 'h3' }>()
const { language, t } = useLanguage()
const date = computed(() =>
  new Intl.DateTimeFormat(localeTags[language.value], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(order.createdAt)),
)
</script>

<template>
  <component :is="heading" class="order-number">
    {{ t('orderId') }}: <bdi>{{ order.id }}</bdi>
  </component>
  <p>
    <time :datetime="order.createdAt">{{ date }}</time>
  </p>
  <ul class="order-items">
    <li v-for="item in order.items" :key="item.id">
      <bdi>{{ item.quantity }} × {{ dishName(item.name, language) }}</bdi>
    </li>
  </ul>
  <p>
    <strong>{{ t('total') }}: {{ formatPrice(order.totalMinor, language) }}</strong>
  </p>
  <p aria-live="polite">
    {{ t('orderStatus') }}:
    <strong class="status-badge" :data-status="order.status">{{
      t(statusLabel[order.status])
    }}</strong>
  </p>
</template>

<style scoped>
.order-number {
  margin-block: 0 0.75rem;
  font-size: 1rem;
  overflow-wrap: anywhere;
}
.order-items {
  padding-inline-start: 1.25rem;
  overflow-wrap: anywhere;
}
.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f0f0f0;
  color: #2f2f2f;
}
.status-badge[data-status='working'] {
  background: #fff1cf;
  color: #654000;
}
.status-badge[data-status='done'] {
  background: #dcefe1;
  color: #174b2a;
}
</style>
