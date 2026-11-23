<script setup lang="ts">
import source from '../assets/lbaldi-photo-source.jpg'

// Each frame shows a food photo from the original artwork, with the artwork’s text cropped out.
const frames = {
  tagine: '92 542 303 223',
  couscous: '433 576 263 186',
  tea: '754 540 268 211',
} as const

defineProps<{ frame: keyof typeof frames }>()
</script>

<template>
  <svg
    :viewBox="frames[frame]"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <image :href="source" width="1419" height="1109" />
  </svg>
</template>

<style scoped>
svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
