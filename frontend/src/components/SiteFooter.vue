<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useLanguage } from '../i18n'
import LbaldiLogo from './LbaldiLogo.vue'

const { t } = useLanguage()
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <RouterLink :to="{ name: 'home' }" :aria-label="t('brand')"><LbaldiLogo /></RouterLink>
        <div>
          <p>{{ t('heroSubtitle') }}</p>
          <p class="footer-credit">
            <bdi>© 2026 Zakaria · <a href="https://github.com/ZakariaL123">@ZakariaL123</a></bdi>
          </p>
        </div>
      </div>
      <nav :aria-label="t('footerNavigation')">
        <RouterLink :to="{ name: 'menu' }">{{ t('menu') }}</RouterLink>
        <RouterLink :to="{ name: 'home', hash: '#our-story' }">{{ t('ourStory') }}</RouterLink>
        <RouterLink :to="{ name: 'my-orders' }">{{ t('myOrders') }}</RouterLink>
      </nav>
      <RouterLink class="button button--cream" :to="{ name: 'menu' }">
        {{ t('orderOnline') }}
      </RouterLink>
    </div>
    <div class="footer-band">
      <p>{{ t('heroBandLine') }}</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #063c28;
  color: var(--lbaldi-cream);
}
.footer-inner {
  width: min(calc(100% - 2 * var(--gutter)), var(--shell-width));
  margin-inline: auto;
  padding-block: clamp(24px, 4vw, 46px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 20px clamp(16px, 4vw, 60px);
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}
.footer-brand > a {
  inline-size: 76px;
  flex: 0 0 auto;
}
.footer-brand p {
  margin: 0;
  max-inline-size: 24ch;
  font-weight: 650;
}
.footer-brand .footer-credit {
  margin-block-start: 6px;
  color: #efdab0;
  font-size: 0.82rem;
  font-weight: 500;
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  font-weight: 700;
}
a:not(.button) {
  color: inherit;
  text-underline-offset: 0.25em;
}
.footer-band {
  padding: 12px var(--gutter);
  background: #052e20;
  color: #efdab0;
  font-size: 0.78rem;
  font-weight: 850;
  text-align: center;
  text-transform: uppercase;
}
.footer-band p {
  margin: 0;
}
a:focus-visible {
  outline-color: var(--lbaldi-cream);
}
@media (max-width: 720px) {
  .footer-inner {
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
  }
}
</style>
