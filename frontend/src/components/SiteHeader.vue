<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { access, auth, isStaff, refreshAccess, signedIn } from '../auth'
import { useLanguage } from '../i18n'
import { useCartStore } from '../stores/cart'
import LbaldiLogo from './LbaldiLogo.vue'

const { language, setLanguage, t } = useLanguage()
const cart = useCartStore()
const router = useRouter()
const route = useRoute()
const signingOut = ref(false)
const signOutFailed = ref(false)

onMounted(refreshAccess)

async function signOut() {
  if (!auth || signingOut.value) return
  signingOut.value = true
  signOutFailed.value = false
  try {
    const { error } = await auth.signOut()
    if (error) throw error
    access.value = 'guest'
    cart.orderReceipt = null
    await router.replace({ name: 'menu' })
  } catch {
    signOutFailed.value = true
  } finally {
    signingOut.value = false
  }
}

const languages = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
] as const
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink to="/" class="brand" :aria-label="t('brand')">
        <LbaldiLogo />
      </RouterLink>

      <nav class="site-nav" :aria-label="t('navigation')">
        <RouterLink to="/menu" class="nav-link">{{ t('menu') }}</RouterLink>
        <RouterLink :to="{ name: 'home', hash: '#our-story' }" custom v-slot="{ href, navigate }">
          <a
            :href="href"
            class="nav-link"
            :aria-current="
              route.name === 'home' && route.hash === '#our-story' ? 'location' : undefined
            "
            @click="navigate"
            >{{ t('ourStory') }}</a
          >
        </RouterLink>
        <RouterLink to="/cart" class="nav-link" aria-live="polite">
          {{ t('cart') }} ({{ cart.itemCount }})
        </RouterLink>
        <RouterLink :to="{ name: 'my-orders' }" class="nav-link">{{ t('myOrders') }}</RouterLink>
        <RouterLink v-if="isStaff" to="/staff/orders" class="nav-link">{{ t('staff') }}</RouterLink>
        <button
          v-if="signedIn"
          class="nav-link sign-out"
          type="button"
          :disabled="signingOut || cart.isPlacingOrder"
          @click="signOut"
        >
          {{ t('signOut') }}
        </button>
        <RouterLink v-else to="/sign-in" class="nav-link">{{ t('login') }}</RouterLink>
      </nav>

      <div class="header-tools">
        <div class="language-switcher" dir="ltr" role="group" :aria-label="t('language')">
          <button
            v-for="option in languages"
            :key="option.value"
            type="button"
            :lang="option.value"
            :aria-pressed="language === option.value"
            @click="setLanguage(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <RouterLink to="/menu" class="button order-link">{{ t('orderOnline') }}</RouterLink>
      </div>

      <p v-if="signOutFailed" class="header-notice" role="alert">{{ t('signOutError') }}</p>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  background: var(--lbaldi-red);
  color: var(--lbaldi-cream);
  border-block-end: 1px solid var(--lbaldi-cream-line);
}

.header-inner {
  width: min(calc(100% - 2 * var(--gutter)), var(--shell-width));
  margin-inline: auto;
  padding-block: 0.5rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'brand nav tools';
  align-items: center;
  gap: 8px clamp(12px, 3vw, 40px);
}

.brand {
  grid-area: brand;
  display: block;
  inline-size: clamp(58px, 7vw, 84px);
}

.site-nav {
  grid-area: nav;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0 clamp(8px, 1.6vw, 20px);
  min-inline-size: 0;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: 44px;
  padding: 4px 2px;
  color: inherit;
  font-size: 0.9rem;
  font-weight: 670;
  line-height: 1.25;
  text-align: center;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.nav-link:hover,
.nav-link[aria-current] {
  text-decoration: underline;
  text-underline-offset: 0.34em;
  text-decoration-color: var(--lbaldi-gold);
  text-decoration-thickness: 2px;
}

.sign-out {
  background: transparent;
  border: 0;
  cursor: pointer;
}

.header-tools {
  grid-area: tools;
  display: grid;
  gap: 8px;
  justify-items: end;
  min-inline-size: 0;
}

.order-link {
  width: 100%;
  padding-block: 0.4rem;
  font-size: 0.9rem;
}

.site-header :is(a, button):focus-visible {
  outline-color: var(--lbaldi-cream);
}

.header-notice {
  grid-column: 1 / -1;
  margin: 0;
}

.language-switcher {
  display: inline-grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(3, minmax(3.65rem, max-content));
  gap: 2px;
}

.language-switcher button {
  min-inline-size: 44px;
  min-block-size: 44px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  padding: 4px 8px;
  color: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.language-switcher button:hover {
  text-decoration: underline;
}

.language-switcher button[aria-pressed='true'] {
  background: var(--lbaldi-cream);
  color: var(--lbaldi-red-deep);
}

@media (min-width: 75rem) {
  .header-tools {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .order-link {
    width: auto;
    white-space: nowrap;
  }
}

@media (max-width: 860px) {
  .header-inner {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas: 'brand tools' 'nav nav';
  }

  .header-tools {
    justify-self: end;
  }

  .site-nav {
    justify-content: space-between;
    border-block-start: 1px solid var(--lbaldi-cream-line);
    padding-block-start: 4px;
  }
}

@media (max-width: 560px) {
  .site-nav {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
  }

  .nav-link {
    font-size: 0.81rem;
  }
}
</style>
