<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import { useLanguage } from './i18n'

const { t } = useLanguage()
const routeContent = ref<HTMLDivElement | null>(null)
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="routeContent?.focus()">
    {{ t('skipToContent') }}
  </a>
  <SiteHeader />
  <div id="main-content" ref="routeContent" class="route-content" tabindex="-1">
    <RouterView />
  </div>
  <SiteFooter />
</template>
