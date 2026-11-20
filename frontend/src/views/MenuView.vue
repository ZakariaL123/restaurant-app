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
        <p class="page-kicker">{{ t('brand') }}</p>
        <h1 id="menu-title" class="page-title">{{ t('ourMenu') }}</h1>
        <p class="masthead-description">{{ t('menuIntro') }}</p>
      </div>
      <RouterLink class="button button--cream" :to="{ name: 'cart' }">
        {{ t('cart') }} ({{ cart.itemCount }})
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
        <article v-for="item in visibleItems" :key="item.id" class="menu-card panel">
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
          <div v-else class="dish-placeholder" aria-hidden="true"><span>LBALDI</span></div>
          <div class="menu-card-body">
            <h2>{{ dishName(item.name, language) }}</h2>
            <p class="muted">{{ dishDescription(item.name, item.description, language) }}</p>
            <div class="dish-actions">
              <strong class="price">{{ formatPrice(item.priceMinor, language) }}</strong>
              <span v-if="!item.isAvailable" class="unavailable">{{ t('unavailable') }}</span>
              <button
                v-else
                class="button"
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
  padding: 14px 18px;
  font-weight: 650;
}
.menu-toolbar input {
  margin-inline-end: 4px;
}
.menu-download {
  color: var(--lbaldi-red);
  text-underline-offset: 0.2em;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(12px, 2.3vw, 24px);
  margin-top: 24px;
}

.menu-card {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.menu-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: clamp(14px, 2vw, 23px);
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
  border-radius: 11px 11px 0 0;
  background: transparent;
  overflow: hidden;
  cursor: zoom-in;
}

.dish-photo-button:focus-visible {
  outline: 3px solid #803c26;
  outline-offset: 2px;
}

.dish-photo,
.dish-placeholder {
  display: block;
  width: 100%;
  aspect-ratio: 1.55;
  object-fit: cover;
}

.dish-placeholder {
  display: grid;
  place-items: center;
  border-radius: 11px 11px 0 0;
  background:
    repeating-radial-gradient(ellipse at 50% 125%, #164d34 0 2px, transparent 3px 17px), #0a3e2a;
  color: #e8cc94;
  font-family: var(--lbaldi-heading);
  font-size: clamp(1.1rem, 3vw, 2rem);
  font-weight: 950;
  letter-spacing: 0.12em;
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
  background: #161311;
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
  background: #fff;
  color: #161311;
  font-size: 1.75rem;
  cursor: pointer;
}

.photo-close:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

h2 {
  margin: 0 0 7px;
  font-size: clamp(1.16rem, 2vw, 1.5rem);
  line-height: 1.2;
}

.price {
  color: var(--lbaldi-red);
  font-size: 1.05rem;
  font-weight: 850;
}

.unavailable {
  border-radius: 999px;
  padding: 5px 9px;
  background: #f5e0d8;
  color: #821d28;
  font-size: 0.78rem;
  font-weight: 750;
}

@media (max-width: 850px) {
  .menu-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  .menu-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
