<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { readToken } from '../auth'
import { localeTags, useLanguage } from '../i18n'
import type { MenuItem } from '../types/menu'
import { formatPrice } from '../utils/formatPrice'
import { prepareDishPhoto } from '../utils/prepareDishPhoto'

type Draft = {
  id: string | null
  name: string
  description: string
  price: number | ''
  isAvailable: boolean
  imageUrl: string
}

const emit = defineEmits<{ 'access-lost': [reason: 'guest' | 'customer'] }>()
const { language, t } = useLanguage()
const items = ref<MenuItem[]>([])
const sortedItems = computed(() =>
  [...items.value].sort((a, b) => a.name.localeCompare(b.name, localeTags[language.value])),
)
const loading = ref(true)
const loadFailed = ref(false)
const saving = ref(false)
const preparing = ref(false)
const notice = ref<
  '' | 'dishSaved' | 'invalidDish' | 'dishSaveError' | 'dishPhotoUnreadable' | 'dishPhotoSaveError'
>('')
const draft = ref<Draft | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const localPhoto = shallowRef<Blob | null>(null)
const previewUrl = ref('')
const photoPreview = computed(() => {
  if (previewUrl.value) return previewUrl.value
  const saved = items.value.find((item) => item.id === draft.value?.id)
  return saved?.imageUrl === draft.value?.imageUrl ? saved?.imageUrl : null
})

function resetPhoto() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  localPhoto.value = null
}

async function selectPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  const form = draft.value
  if (!file || !form || saving.value || preparing.value) return

  preparing.value = true
  notice.value = ''
  try {
    const photo = await prepareDishPhoto(file)
    if (draft.value !== form) return
    resetPhoto()
    previewUrl.value = URL.createObjectURL(photo)
    localPhoto.value = photo
  } catch {
    if (draft.value === form) notice.value = 'dishPhotoUnreadable'
  } finally {
    preparing.value = false
  }
}

function removePhoto() {
  resetPhoto()
  if (draft.value) draft.value.imageUrl = ''
}

async function loadMenu() {
  loading.value = true
  loadFailed.value = false
  try {
    const response = await fetch('/api/menu', { cache: 'no-store' })
    if (!response.ok) throw new Error('Could not load the menu')
    items.value = await response.json()
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

async function editDish(item?: MenuItem) {
  resetPhoto()
  notice.value = ''
  draft.value = {
    id: item?.id ?? null,
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item ? item.priceMinor / 100 : '',
    isAvailable: item?.isAvailable ?? true,
    imageUrl: item?.imageUrl ?? '',
  }
  await nextTick()
  nameInput.value?.focus()
}

function cancelEdit() {
  resetPhoto()
  draft.value = null
  notice.value = ''
}

async function saveDish() {
  const form = draft.value
  if (!form || saving.value || preparing.value) return
  if (typeof form.price !== 'number' || !form.name.trim() || !form.description.trim()) {
    notice.value = 'invalidDish'
    return
  }

  saving.value = true
  notice.value = ''
  try {
    const token = await readToken()
    if (!token) return emit('access-lost', 'guest')
    if (localPhoto.value) {
      const upload = await fetch('/api/staff/menu/photos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' },
        body: localPhoto.value,
      }).catch(() => null)
      if (upload?.status === 401) return emit('access-lost', 'guest')
      if (upload?.status === 403) return emit('access-lost', 'customer')
      if (!upload?.ok) {
        notice.value = 'dishPhotoSaveError'
        return
      }
      const { imageUrl } = (await upload.json()) as { imageUrl: string }
      form.imageUrl = imageUrl
      localPhoto.value = null
    }
    const path = form.id ? `/api/staff/menu/${encodeURIComponent(form.id)}` : '/api/staff/menu'
    const response = await fetch(path, {
      method: form.id ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim(),
        priceMinor: Math.round(form.price * 100),
        isAvailable: form.isAvailable,
        imageUrl: form.imageUrl.trim() || null,
      }),
    })

    if (response.status === 401) return emit('access-lost', 'guest')
    if (response.status === 403) return emit('access-lost', 'customer')
    if (response.status === 400 || response.status === 413) {
      notice.value = 'invalidDish'
      return
    }
    if (!response.ok) throw new Error('Could not save the dish')

    const saved: MenuItem = await response.json()
    items.value = [...items.value.filter((item) => item.id !== saved.id), saved]
    resetPhoto()
    draft.value = null
    notice.value = 'dishSaved'
  } catch {
    notice.value = 'dishSaveError'
  } finally {
    saving.value = false
  }
}

onMounted(loadMenu)
onUnmounted(() => {
  draft.value = null
  resetPhoto()
})
</script>

<template>
  <details class="menu-manager panel">
    <summary>{{ t('manageMenu') }}</summary>

    <p v-if="loading" role="status">{{ t('loadingMenu') }}</p>
    <template v-else-if="loadFailed">
      <p role="alert">{{ t('menuError') }}</p>
      <button class="button button--outline" type="button" @click="loadMenu">
        {{ t('retry') }}
      </button>
    </template>
    <template v-else>
      <button class="button" type="button" :disabled="saving || preparing" @click="editDish()">
        {{ t('addDish') }}
      </button>
      <p v-if="notice" :role="notice === 'dishSaved' ? 'status' : 'alert'">{{ t(notice) }}</p>

      <form v-if="draft" @submit.prevent="saveDish">
        <fieldset :disabled="saving || preparing">
          <legend>{{ t(draft.id ? 'editDish' : 'addDish') }}</legend>
          <label>
            {{ t('dishName') }}
            <input
              ref="nameInput"
              v-model="draft.name"
              class="form-field"
              maxlength="120"
              required
            />
          </label>
          <label>
            {{ t('dishDescription') }}
            <textarea
              v-model="draft.description"
              class="form-field"
              rows="3"
              maxlength="2000"
              required
            ></textarea>
          </label>
          <label>
            {{ t('dishPrice') }}
            <input
              v-model="draft.price"
              class="form-field"
              type="number"
              min="0"
              max="21474836.47"
              step="0.01"
              required
            />
          </label>
          <div class="photo-editor">
            <strong>{{ t('dishPhoto') }}</strong>
            <img
              v-if="photoPreview"
              class="photo-preview"
              :src="photoPreview"
              :alt="t('dishPhotoPreview')"
            />
            <input ref="fileInput" type="file" accept="image/*" hidden @change="selectPhoto" />
            <input
              ref="cameraInput"
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              @change="selectPhoto"
            />
            <div class="form-actions">
              <button class="button button--outline" type="button" @click="fileInput?.click()">
                {{ t('chooseDishPhoto') }}
              </button>
              <button
                class="button button--outline camera-button"
                type="button"
                @click="cameraInput?.click()"
              >
                {{ t('takeDishPhoto') }}
              </button>
              <button
                v-if="photoPreview || draft.imageUrl"
                class="button button--outline"
                type="button"
                @click="removePhoto"
              >
                {{ t('removeDishPhoto') }}
              </button>
            </div>
            <p v-if="preparing" role="status">{{ t('preparingDishPhoto') }}</p>
            <details v-if="!previewUrl">
              <summary>{{ t('useDishPhotoLink') }}</summary>
              <label>
                {{ t('dishPhotoLink') }}
                <input
                  v-model="draft.imageUrl"
                  class="form-field"
                  placeholder="https://…"
                  dir="ltr"
                  maxlength="2048"
                />
              </label>
            </details>
          </div>
          <label class="available-checkbox">
            <input v-model="draft.isAvailable" type="checkbox" />
            {{ t('dishAvailable') }}
          </label>
          <div class="form-actions">
            <button class="button" type="submit">
              {{ t(saving ? 'savingDish' : 'saveDish') }}
            </button>
            <button class="button button--outline" type="button" @click="cancelEdit">
              {{ t('cancel') }}
            </button>
          </div>
        </fieldset>
      </form>

      <p v-if="!sortedItems.length">{{ t('noDishes') }}</p>
      <ul v-else class="dish-list">
        <li v-for="item in sortedItems" :key="item.id">
          <div>
            <strong>{{ item.name }}</strong>
            <div>
              {{ formatPrice(item.priceMinor, language) }} ·
              {{ t(item.isAvailable ? 'dishAvailable' : 'unavailable') }}
            </div>
          </div>
          <button
            type="button"
            class="button button--outline"
            :disabled="saving || preparing"
            :aria-label="`${t('editDish')} (${item.name})`"
            @click="editDish(item)"
          >
            {{ t('editDish') }}
          </button>
        </li>
      </ul>
    </template>
  </details>
</template>

<style scoped>
.menu-manager {
  padding: 16px;
  min-inline-size: 0;
}

summary {
  font-weight: 700;
  cursor: pointer;
}

.menu-manager > summary {
  color: var(--lbaldi-green);
}

.menu-manager[open] > summary {
  margin-block-end: 16px;
}

form {
  margin-block-start: 16px;
  max-width: 40rem;
}

fieldset {
  display: grid;
  gap: 12px;
  min-inline-size: 0;
  border: 1px solid var(--edge);
  border-radius: 8px;
}

fieldset label {
  display: grid;
  gap: 4px;
}

.photo-editor {
  display: grid;
  gap: 8px;
}

.photo-preview {
  display: block;
  width: min(100%, 14rem);
  max-height: 14rem;
  object-fit: contain;
  border-radius: 6px;
}

.camera-button {
  display: none;
}

@media (any-pointer: coarse) {
  .camera-button {
    display: inline-block;
  }
}

fieldset .available-checkbox,
.form-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.dish-list {
  padding: 0;
  list-style: none;
}

.dish-list li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px 16px;
  padding-block: 10px;
  border-block-end: 1px solid var(--edge);
  overflow-wrap: anywhere;
}
</style>
