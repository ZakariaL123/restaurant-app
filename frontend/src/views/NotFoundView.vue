<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useLanguage } from '../i18n'

const { t } = useLanguage()
</script>

<template>
  <main class="page-shell not-found-page">
    <div class="panel panel-empty">
      <h1 class="page-title">{{ t('notFound') }}</h1>
      <p class="muted">{{ t('notFoundHelp') }}</p>
      <RouterLink class="button" :to="{ name: 'home' }">{{ t('backHome') }}</RouterLink>
    </div>
  </main>
</template>

<style scoped>
h1 {
  margin-block-end: 12px;
}
</style>
