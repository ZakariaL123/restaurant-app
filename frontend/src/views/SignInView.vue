<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth, canAccessStaff, readToken, refreshAccess, signedIn } from '../auth'
import { useLanguage } from '../i18n'

const { t } = useLanguage()
const route = useRoute()
const router = useRouter()
const inviteToken = computed(() => /^#staff-invite=([A-Za-z0-9_-]{43})$/.exec(route.hash)?.[1])
const signingUp = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const busy = ref(false)
type Notice =
  | 'accessUnavailable'
  | 'signInError'
  | 'sessionMissing'
  | 'verifyEmail'
  | 'emailInUse'
  | 'customerSignupError'
  | 'customerCreated'
  | 'setupPassword'
  | 'setupUnavailable'
  | 'inviteInvalid'
const notice = ref<Notice | ''>('')
const message = computed(
  () => notice.value || (route.query.reason === 'unavailable' ? 'accessUnavailable' : ''),
)

function toggleSignup() {
  signingUp.value = !signingUp.value
  notice.value = ''
  password.value = ''
}

function errorMessage(error: unknown, fallback: Notice): Notice {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  if (code === 'EMAIL_NOT_VERIFIED') return 'verifyEmail'
  if (code === 'USER_ALREADY_EXISTS' || code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')
    return 'emailInUse'
  if (code === 'EMAIL_PASSWORD_SIGN_UP_DISABLED') return 'setupUnavailable'
  if (code === 'PASSWORD_TOO_SHORT' || code === 'PASSWORD_TOO_LONG') return 'setupPassword'
  return fallback
}

async function submit() {
  if (!auth || busy.value) return
  const creating = signingUp.value
  busy.value = true
  notice.value = ''
  try {
    const credentials = { email: email.value.trim(), password: password.value }
    if (creating) {
      const { error } = await auth.signUp.email({
        ...credentials,
        name: name.value.trim(),
        callbackURL: new URL('/sign-in', window.location.origin).href,
      })
      if (error) throw error
      signingUp.value = false
    } else {
      const { error } = await auth.signIn.email(credentials)
      if (error) throw error
    }

    const access = await refreshAccess()
    if (access === 'unavailable') notice.value = 'accessUnavailable'
    else if (access === 'guest') notice.value = creating ? 'customerCreated' : 'sessionMissing'
    else if (!inviteToken.value) {
      const next = route.query.next
      if (next === 'orders') await router.replace({ name: 'my-orders' })
      else if (next === 'cart') await router.replace({ name: 'cart' })
      else if (next === 'staff' && canAccessStaff(access))
        await router.replace({ name: 'staff-orders' })
      else await router.replace({ name: 'menu' })
    }
  } catch (error) {
    notice.value = errorMessage(error, creating ? 'customerSignupError' : 'signInError')
  } finally {
    password.value = ''
    busy.value = false
  }
}

async function acceptInvite() {
  if (!inviteToken.value || busy.value) return
  busy.value = true
  notice.value = ''
  try {
    const token = await readToken()
    if (!token) {
      await refreshAccess()
      notice.value = 'sessionMissing'
      return
    }
    const response = await fetch('/api/staff/invites/accept', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteToken.value }),
    })
    if (response.status === 400 || response.status === 403) notice.value = 'inviteInvalid'
    else if (response.status === 401) {
      await refreshAccess()
      notice.value = 'sessionMissing'
    } else if (response.ok) {
      await router.replace({ name: 'staff-orders' })
    } else notice.value = 'accessUnavailable'
  } catch {
    notice.value = 'accessUnavailable'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="page-shell login-page">
    <div class="panel login-card">
      <p class="page-kicker">{{ t('brand') }}</p>
      <h1 class="page-title">{{ t('login') }}</h1>
      <p v-if="!auth" role="status">{{ t('authMissing') }}</p>
      <template v-else>
        <p v-if="inviteToken">{{ t('inviteSignIn') }}</p>
        <p v-if="message" :role="message === 'customerCreated' ? 'status' : 'alert'">
          {{ t(message) }}
        </p>
        <button
          v-if="inviteToken && signedIn"
          type="button"
          class="button"
          :disabled="busy"
          @click="acceptInvite"
        >
          {{ t('acceptInvite') }}
        </button>
        <form v-else @submit.prevent="submit">
          <label v-if="signingUp">
            {{ t('name') }} <input v-model="name" class="form-field" autocomplete="name" required />
          </label>
          <label>
            {{ t('email') }}
            <input
              v-model="email"
              class="form-field"
              type="email"
              autocomplete="username"
              required
            />
          </label>
          <label>
            {{ t('password') }}
            <input
              v-model="password"
              class="form-field"
              type="password"
              :autocomplete="signingUp ? 'new-password' : 'current-password'"
              :minlength="signingUp ? 8 : undefined"
              maxlength="128"
              required
            />
          </label>
          <small v-if="signingUp">{{ t('setupPassword') }}</small>
          <button class="button" type="submit" :disabled="busy">
            {{ t(signingUp ? 'createAccount' : 'login') }}
          </button>
          <button
            class="button button--outline"
            type="button"
            :disabled="busy"
            @click="toggleSignup"
          >
            {{ t(signingUp ? 'backToSignIn' : 'createAccount') }}
          </button>
        </form>
      </template>
    </div>
  </main>
</template>

<style scoped>
.login-page {
  max-width: 32rem;
  display: grid;
  align-content: center;
}
.login-card {
  padding: clamp(20px, 5vw, 42px);
}
.page-title {
  font-size: clamp(2rem, 4vw, 3.45rem);
}
form,
label {
  display: grid;
  gap: 8px;
}
form {
  margin-block: 24px 0;
  gap: 14px;
}
label {
  font-weight: 700;
}
</style>
