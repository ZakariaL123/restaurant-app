<script setup lang="ts">
import { useId } from 'vue'
import artwork from '../assets/lbaldi-photo-source.jpg'

const id = useId()
const ink = id + '-logo-ink'
const opening = id + '-logo-opening'
</script>

<template>
  <svg viewBox="106 95 386 350" aria-hidden="true" focusable="false">
    <defs>
      <filter
        :id="ink"
        filterUnits="userSpaceOnUse"
        x="106"
        y="95"
        width="386"
        height="350"
        color-interpolation-filters="sRGB"
      >
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 1.75 0 0 -.4"
          result="ink"
        />
        <feFlood flood-color="#fff1d5" />
        <feComposite in2="ink" operator="in" />
      </filter>
      <mask :id="opening" maskUnits="userSpaceOnUse" x="106" y="95" width="386" height="350">
        <rect x="106" y="95" width="386" height="350" fill="white" />
        <rect x="106" y="95" width="90" height="25" fill="black" />
        <rect x="482" y="95" width="10" height="194" fill="black" />
        <path d="M146 319H165L156 378 139 381 140 365Z" fill="black" />
      </mask>
    </defs>
    <image
      :href="artwork"
      width="1419"
      height="1109"
      :filter="'url(#' + ink + ')'"
      :mask="'url(#' + opening + ')'"
    />
  </svg>
</template>

<style scoped>
svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: hidden;
}
</style>
