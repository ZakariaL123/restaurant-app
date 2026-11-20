<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LbaldiLogo from '../components/LbaldiLogo.vue'
import LbaldiPhoto from '../components/LbaldiPhoto.vue'
import { useLanguage } from '../i18n'
import { dishName } from '../utils/dishText'

const { language, t } = useLanguage()

const gallery = ['tagine', 'couscous', 'tea', 'kefta'] as const
const favourites = [
  { frame: 'favouriteTagine', name: 'Chicken Tagine' },
  { frame: 'favouriteCouscous', name: 'Vegetable Couscous' },
  { frame: 'favouriteKefta', name: 'Kefta Tagine' },
] as const
</script>

<template>
  <main class="home-page">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-intro page-width">
        <LbaldiLogo class="hero-logo" />
        <div class="hero-copy">
          <h1 id="hero-title">
            <span>{{ t('heroTitleOne') }}</span>
            <span>{{ t('heroTitleTwo') }}</span>
            <span>{{ t('heroTitleThree') }}</span>
          </h1>
          <p>{{ t('heroSubtitle') }}</p>
          <div class="hero-links">
            <RouterLink class="menu-cta" :to="{ name: 'menu' }">{{ t('exploreMenu') }}</RouterLink>
            <RouterLink class="text-link" :to="{ name: 'home', hash: '#our-story' }">
              {{ t('ourStory') }}
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="photo-band">
        <div class="photo-strip page-width" aria-hidden="true">
          <div v-for="frame in gallery" :key="frame" class="gallery-photo">
            <LbaldiPhoto :frame="frame" />
          </div>
        </div>
        <p class="band-line">{{ t('heroBandLine') }}</p>
      </div>
    </section>

    <section class="favourites" aria-labelledby="favourites-title">
      <div class="page-width favourites-layout">
        <div class="favourites-intro">
          <h2 id="favourites-title">{{ t('houseFavourites') }}</h2>
          <RouterLink class="text-link" :to="{ name: 'menu' }">{{ t('viewFullMenu') }}</RouterLink>
        </div>
        <ul class="favourites-grid">
          <li v-for="dish in favourites" :key="dish.frame" class="favourite">
            <div class="favourite-photo"><LbaldiPhoto :frame="dish.frame" /></div>
            <p>{{ dishName(dish.name, language) }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section id="our-story" class="story" aria-labelledby="story-title">
      <div class="page-width story-copy">
        <h2 id="story-title">{{ t('ourStory') }}</h2>
        <p>{{ t('storyText') }}</p>
        <RouterLink class="text-link" :to="{ name: 'menu' }">{{ t('exploreMenu') }}</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  overflow: clip;
  background: var(--lbaldi-cream);
  color: var(--lbaldi-green);
}

.page-width {
  width: min(100% - clamp(2rem, 8vw, 8rem), 82rem);
  margin-inline: auto;
}

.hero {
  overflow: clip;
  color: var(--lbaldi-cream);
  background:
    radial-gradient(ellipse at 65% 30%, #bc2526 0%, transparent 57%),
    linear-gradient(140deg, #b21922 0%, #981219 70%);
}

.hero-intro {
  display: grid;
  grid-template-columns: minmax(0, 0.93fr) minmax(0, 2.07fr);
  align-items: center;
  gap: clamp(12px, 3vw, 42px);
  padding-block: clamp(25px, 3vw, 48px) clamp(10px, 2.5vw, 30px);
}

.hero-logo {
  width: min(100%, 25rem);
  justify-self: center;
}

h1,
h2,
.band-line {
  font-family: var(--lbaldi-heading);
  font-weight: 950;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 6.55vw, 6.3rem);
  line-height: 0.92;
  letter-spacing: -0.04em;
}

h1 span {
  display: block;
}

h1:lang(fr) {
  font-size: clamp(2rem, 5.9vw, 5.65rem);
}

h1:lang(ar) {
  font-size: clamp(2.5rem, 6.5vw, 6rem);
  line-height: 1.16;
  letter-spacing: normal;
}

.hero-copy p {
  margin-block: 14px 16px;
  font-size: clamp(1rem, 2vw, 1.8rem);
}

.hero-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px 26px;
}

.menu-cta,
.text-link {
  font-size: clamp(1rem, 1.55vw, 1.4rem);
  font-weight: 750;
}

.menu-cta {
  display: inline-block;
  border-radius: 9px;
  padding: 12px clamp(17px, 2.1vw, 30px);
  background: var(--lbaldi-green);
  color: var(--lbaldi-cream);
  text-decoration: none;
}

.menu-cta:hover {
  background: #003b20;
}

.text-link {
  color: inherit;
  text-underline-offset: 0.24em;
}

a:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}

.photo-band {
  position: relative;
  isolation: isolate;
  padding-block: 12px 20px;
}

.photo-band::before {
  position: absolute;
  z-index: -1;
  inset: 7% -10% -1px;
  border-radius: 50% 50% 0 0 / 48% 48% 0 0;
  background: var(--lbaldi-green);
  content: '';
}

.photo-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: clamp(10px, 1.6vw, 23px);
  padding-block: 10px 8px;
}

.gallery-photo {
  aspect-ratio: 1.25;
  overflow: hidden;
  border-radius: 6px;
  background: #0c472f;
  box-shadow: 0 8px 20px rgb(0 0 0 / 23%);
}

.gallery-photo:nth-child(1) {
  transform: translateY(-5px) rotate(-5deg);
}
.gallery-photo:nth-child(2) {
  transform: translateY(18px) rotate(-1deg);
}
.gallery-photo:nth-child(3) {
  transform: translateY(-5px) rotate(6deg);
}
.gallery-photo:nth-child(4) {
  transform: translateY(12px) rotate(-5deg);
}

.band-line {
  position: relative;
  margin: 22px 0 0;
  padding-inline: 16px;
  text-align: center;
  font-size: clamp(1rem, 2.2vw, 1.8rem);
  letter-spacing: 0.075em;
}

.favourites {
  padding-block: clamp(24px, 3.2vw, 45px);
}

.favourites-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 2.55fr);
  gap: clamp(18px, 2.4vw, 34px);
  align-items: center;
}

.favourites h2,
.story h2 {
  margin-block: 0 14px;
  font-size: clamp(1.7rem, 3.5vw, 3.45rem);
  line-height: 0.98;
  letter-spacing: -0.045em;
}

.favourites .text-link {
  color: #981219;
}

.favourites-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(10px, 1.4vw, 20px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.favourite {
  min-width: 0;
  border: 1px solid #d9c7a7;
  border-radius: 12px;
  overflow: hidden;
  background: #fff6e4;
}

.favourite-photo {
  aspect-ratio: 1.85;
  overflow: hidden;
}

.favourite p {
  margin: 0;
  padding: 8px 5px;
  font-size: clamp(0.85rem, 1.5vw, 1.28rem);
  font-weight: 800;
  text-align: center;
}

.story {
  scroll-margin-top: 16px;
  padding-block: clamp(32px, 5vw, 72px);
  background: var(--lbaldi-green);
  color: var(--lbaldi-cream);
}

.story-copy {
  max-width: 53rem;
}

.story p {
  max-width: 48ch;
  font-size: clamp(1rem, 1.8vw, 1.35rem);
  line-height: 1.6;
}

:is(h2, .band-line):lang(ar) {
  letter-spacing: normal;
  line-height: 1.2;
}

@media (max-width: 720px) {
  .hero-intro {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    text-align: center;
  }

  .hero-logo {
    max-width: 9rem;
  }

  h1 {
    font-size: clamp(2rem, 9.7vw, 4.25rem);
  }

  h1:lang(fr) {
    font-size: clamp(1.75rem, 8vw, 3.75rem);
  }

  h1:lang(ar) {
    font-size: clamp(2.1rem, 9vw, 4.25rem);
  }

  .hero-links {
    justify-content: center;
  }

  .photo-strip {
    max-width: 35rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    padding: 14px 8px;
  }

  .gallery-photo:nth-child(n) {
    transform: rotate(-3deg);
  }

  .gallery-photo:nth-child(even) {
    transform: rotate(3deg);
  }

  .photo-band::before {
    inset-block-start: 18%;
    border-radius: 50% 50% 0 0 / 18% 18% 0 0;
  }

  .band-line {
    margin-top: 10px;
  }

  .favourites-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 410px) {
  .favourites-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
