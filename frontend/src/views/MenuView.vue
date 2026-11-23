<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useLanguage } from '../i18n'
import { dishDescription, dishName } from '../utils/dishText'
import { useCartStore } from '../stores/cart'
import type { MenuItem } from '../types/menu'
import { formatPrice } from '../utils/formatPrice'

const cart = useCartStore()
const { language, t } = useLanguage()
const menuItems = ref<MenuItem[]>([])
const showAvailableOnly = ref(false)
const loading = ref(true)
const error = ref<'' | 'menuError'>('')
const photoDialog = ref<HTMLDialogElement | null>(null)
const selectedPhoto = ref<{ url: string; name: string } | null>(null)
let request: AbortController | undefined
let events: EventSource | undefined

const visibleItems = computed(() =>
  showAvailableOnly.value ? menuItems.value.filter((item) => item.isAvailable) : menuItems.value,
)

async function openPhoto(item: MenuItem) {
  if (!item.imageUrl || !photoDialog.value) return
  selectedPhoto.value = { url: item.imageUrl, name: dishName(item.name, language.value) }
  await nextTick()
  photoDialog.value?.showModal()
}

async function loadMenu() {
  request?.abort()
  events?.close()
  const controller = new AbortController()
  request = controller
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/menu', { signal: controller.signal })
    if (!response.ok) throw new Error('Menu request failed.')
    const items: MenuItem[] = await response.json()
    if (controller.signal.aborted) return

    menuItems.value = items
    events = new EventSource('/api/menu/live')
    events.addEventListener('menu', (event: MessageEvent<string>) => {
      menuItems.value = JSON.parse(event.data) as MenuItem[]
    })
  } catch {
    if (!controller.signal.aborted) error.value = 'menuError'
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}

onMounted(loadMenu)
onUnmounted(() => {
  request?.abort()
  events?.close()
})
</script>

<template>
  <main class="page-shell menu-page">
    <section class="page-masthead" aria-labelledby="menu-title">
      <div class="masthead-copy">
        <h1 id="menu-title" class="page-title">{{ t('ourMenu') }}</h1>
        <p class="masthead-description">{{ t('menuIntro') }}</p>
      </div>
      <RouterLink
        class="button"
        :to="{ name: 'cart' }"
        :aria-label="`${t('cart')} (${cart.itemCount})`"
      >
        {{ t('cart') }} <span class="cart-badge">{{ cart.itemCount }}</span>
      </RouterLink>
    </section>

    <p v-if="loading" role="status">{{ t('loadingMenu') }}</p>
    <div v-else-if="error" class="panel panel-empty">
      <p role="alert">{{ t(error) }}</p>
      <button type="button" class="button" @click="loadMenu">{{ t('retry') }}</button>
    </div>

    <template v-else>
      <div class="menu-toolbar panel">
        <label
          ><input v-model="showAvailableOnly" type="checkbox" /> {{ t('availableOnly') }}</label
        >
        <a class="menu-download" href="/api/menu/download">{{ t('download') }}</a>
      </div>

      <p v-if="visibleItems.length === 0" class="panel panel-empty">{{ t('noDishes') }}</p>

      <div v-else class="menu-grid">
        <article
          v-for="item in visibleItems"
          :key="item.id"
          class="menu-card"
          :class="{ 'menu-card--with-photo': item.imageUrl }"
        >
          <button
            v-if="item.imageUrl"
            class="dish-photo-button"
            type="button"
            aria-haspopup="dialog"
            :aria-label="`${t('enlargePhoto')} (${dishName(item.name, language)})`"
            @click="openPhoto(item)"
          >
            <img class="dish-photo" :src="item.imageUrl" alt="" loading="lazy" />
          </button>
          <div class="menu-card-body">
            <h2>{{ dishName(item.name, language) }}</h2>
            <p class="muted">{{ dishDescription(item.name, item.description, language) }}</p>
            <div class="dish-actions">
              <strong class="price">{{ formatPrice(item.priceMinor, language) }}</strong>
              <span v-if="!item.isAvailable" class="unavailable">{{ t('unavailable') }}</span>
              <button
                v-else
                class="button button--order"
                type="button"
                :aria-label="`${t('add')} (${dishName(item.name, language)})`"
                :disabled="cart.isPlacingOrder"
                @click="cart.addItem(item)"
              >
                {{ t('add') }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </template>

    <dialog
      ref="photoDialog"
      class="photo-dialog"
      :aria-label="selectedPhoto?.name"
      @close="selectedPhoto = null"
    >
      <button
        class="photo-close"
        type="button"
        :aria-label="t('closePhoto')"
        @click="photoDialog?.close()"
      >
        <span aria-hidden="true">×</span>
      </button>
      <img v-if="selectedPhoto" :src="selectedPhoto.url" :alt="selectedPhoto.name" />
    </dialog>
  </main>
</template>

<style scoped>
.menu-toolbar,
.dish-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.menu-toolbar {
  padding: 0.35rem 1rem;
  font-weight: 650;
}

.menu-toolbar label,
.menu-download {
  display: inline-flex;
  min-block-size: 44px;
  align-items: center;
}

.menu-toolbar input {
  inline-size: 1rem;
  block-size: 1rem;
  margin-inline: 0 0.5rem;
}
.menu-download {
  color: var(--lbaldi-green);
  text-underline-offset: 0.2em;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(1.25rem, 4vw, 3.2rem);
  margin-block: 1.5rem;
  border-block-end: 1px solid var(--edge);
}

.menu-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  min-inline-size: 0;
  padding-block: 1.4rem;
  border-block-start: 1px solid var(--edge);
}

.menu-card--with-photo {
  grid-template-columns: minmax(5rem, 0.44fr) minmax(0, 1fr);
  gap: clamp(0.7rem, 2vw, 1.3rem);
}

.menu-card-body {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  overflow-wrap: anywhere;
}
.menu-card-body p {
  margin-block: 0 16px;
  line-height: 1.5;
}
.dish-actions {
  margin-block-start: auto;
}

.dish-photo-button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--photo-radius);
  background: transparent;
  overflow: hidden;
  cursor: zoom-in;
}

.dish-photo-button:focus-visible {
  outline: 3px solid var(--lbaldi-red);
  outline-offset: 2px;
}

.dish-photo {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .dish-photo {
    transition: transform 190ms ease-out;
  }

  .dish-photo-button:hover .dish-photo {
    transform: scale(1.035);
  }
}

.photo-dialog {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 4rem 1rem 1rem;
  border: 0;
  background: var(--ink-dim);
}

.photo-dialog img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.photo-close {
  position: absolute;
  inset-block-start: 0.75rem;
  inset-inline-end: 1rem;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--lbaldi-cream);
  color: var(--ink-dim);
  font-size: 1.75rem;
  cursor: pointer;
}

.photo-close:focus-visible {
  outline: 2px solid var(--lbaldi-cream);
  outline-offset: 3px;
}

h2 {
  margin: 0 0 7px;
  font-family: var(--lbaldi-heading);
  font-size: clamp(1.35rem, 2.3vw, 1.8rem);
  line-height: 1.2;
}

.price {
  color: var(--lbaldi-green);
  font-size: 1.05rem;
  font-variant-numeric: tabular-nums;
  font-weight: 750;
}

.unavailable {
  border-radius: 999px;
  padding: 5px 9px;
  background: var(--error-surface);
  color: var(--error);
  font-size: 0.85rem;
  font-weight: 750;
}

@media (max-width: 700px) {
  .menu-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 360px) {
  .menu-card--with-photo {
    grid-template-columns: minmax(0, 1fr);
  }

  .dish-photo {
    aspect-ratio: 1.7;
  }
}
</style>
