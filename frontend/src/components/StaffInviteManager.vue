<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { readToken, refreshAccess } from '../auth'
import { useLanguage } from '../i18n'

interface StaffEntry {
  email: string
  status: 'active' | 'pending' | 'expired'
}

const { t } = useLanguage()
const entries = ref<StaffEntry[]>([])
const email = ref('')
const inviteLink = ref('')
const linkInput = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const notice = ref<'' | 'staffInviteError' | 'staffAlreadyActive' | 'staffLinkCopied'>('')

const statusLabels = {
  active: 'staffActive',
  pending: 'staffPending',
  expired: 'staffExpired',
} as const

async function request(method: 'GET' | 'POST' | 'DELETE', address?: string) {
  const token = await readToken()
  if (!token) {
    await refreshAccess()
    throw new Error('No sign-in')
  }
  const options: RequestInit = {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }
  if (method !== 'GET') options.body = JSON.stringify({ email: address })
  const response = await fetch('/api/manager/staff', options)
  if (response.status === 401 || response.status === 403) await refreshAccess()
  return response
}

async function loadStaff() {
  busy.value = true
  notice.value = ''
  try {
    const response = await request('GET')
    if (!response.ok) throw new Error('Could not load staff access')
    entries.value = await response.json()
  } catch {
    notice.value = 'staffInviteError'
  } finally {
    busy.value = false
  }
}

async function changeAccess(method: 'POST' | 'DELETE', address: string) {
  if (busy.value) return
  const normalized = address.trim().toLowerCase()
  if (!normalized) return
  busy.value = true
  notice.value = ''
  inviteLink.value = ''
  try {
    const response = await request(method, normalized)
    if (response.status === 409) {
      notice.value = 'staffAlreadyActive'
      return
    }
    if (!response.ok) throw new Error('Could not update staff access')
    entries.value = entries.value.filter((entry) => entry.email !== normalized)
    if (method === 'POST') {
      const { token } = (await response.json()) as { token: string }
      inviteLink.value = new URL(`/sign-in#staff-invite=${token}`, window.location.origin).href
      entries.value.push({ email: normalized, status: 'pending' })
      email.value = ''
    }
  } catch {
    notice.value = 'staffInviteError'
  } finally {
    busy.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    notice.value = 'staffLinkCopied'
  } catch {
    linkInput.value?.select()
  }
}

onMounted(loadStaff)
</script>

<template>
  <details class="staff-access panel">
    <summary>{{ t('manageStaff') }}</summary>
    <form @submit.prevent="changeAccess('POST', email)">
      <label>
        {{ t('staffEmail') }}
        <input v-model="email" class="form-field" type="email" dir="ltr" maxlength="254" required />
      </label>
      <button class="button" type="submit" :disabled="busy">{{ t('inviteStaff') }}</button>
    </form>
    <p v-if="notice" :role="notice === 'staffLinkCopied' ? 'status' : 'alert'">{{ t(notice) }}</p>
    <div v-if="inviteLink">
      <p>{{ t('staffShareInvite') }}</p>
      <label>
        {{ t('staffInviteLink') }}
        <input
          ref="linkInput"
          class="form-field"
          :value="inviteLink"
          type="text"
          readonly
          dir="ltr"
        />
      </label>
      <button class="button button--outline" type="button" @click="copyLink">
        {{ t('staffCopyLink') }}
      </button>
    </div>
    <ul v-if="entries.length">
      <li v-for="entry in entries" :key="entry.email">
        <div>
          <bdi>{{ entry.email }}</bdi> · {{ t(statusLabels[entry.status]) }}
        </div>
        <button
          class="button button--outline"
          type="button"
          :disabled="busy"
          @click="changeAccess('DELETE', entry.email)"
        >
          {{ t(entry.status === 'active' ? 'removeStaffAccess' : 'cancelStaffInvite') }}
        </button>
      </li>
    </ul>
    <p v-else-if="!busy && !notice">{{ t('noStaffInvites') }}</p>
    <button class="button button--outline" type="button" :disabled="busy" @click="loadStaff">
      {{ t('refreshStaff') }}
    </button>
  </details>
</template>

<style scoped>
.staff-access {
  padding: 16px;
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
summary {
  font-weight: 700;
  cursor: pointer;
  color: var(--lbaldi-green);
}
form,
li {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-block: 12px;
}
label {
  display: grid;
  gap: 4px;
  max-width: 36rem;
  min-inline-size: 0;
}
.staff-access div > button {
  margin-block-start: 8px;
}
ul {
  padding-inline-start: 0;
  list-style: none;
}
</style>
