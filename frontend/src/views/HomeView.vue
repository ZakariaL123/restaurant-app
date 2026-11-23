<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LbaldiPhoto from '../components/LbaldiPhoto.vue'
import { useLanguage } from '../i18n'
import { dishName } from '../utils/dishText'

const { language, t } = useLanguage()

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
        <div class="hero-copy">
          <h1 id="hero-title">
            <span>{{ t('heroTitleOne') }} </span>
            <span>{{ t('heroTitleTwo') }} </span>
            <span>{{ t('heroTitleThree') }}</span>
          </h1>
          <p>{{ t('heroSubtitle') }}</p>
          <div class="hero-links">
            <RouterLink class="button button--cream" :to="{ name: 'menu' }">
              {{ t('exploreMenu') }}
            </RouterLink>
            <RouterLink class="text-link" :to="{ name: 'home', hash: '#our-story' }">
              {{ t('ourStory') }}
            </RouterLink>
          </div>
        </div>
        <img
          class="hero-photo"
          src="/dishes/chicken-tagine.jpg"
          :alt="dishName('Chicken Tagine', language)"
          width="612"
          height="612"
          fetchpriority="high"
        />
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
      <div class="page-width story-layout">
        <div class="story-photo"><LbaldiPhoto frame="tea" /></div>
        <div class="story-copy">
          <h2 id="story-title">{{ t('ourStory') }}</h2>
          <p>{{ t('storyText') }}</p>
          <RouterLink class="text-link" :to="{ name: 'menu' }">{{ t('exploreMenu') }}</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  background: var(--paper);
}

.page-width {
  width: min(calc(100% - 2 * var(--gutter)), var(--shell-width));
  margin-inline: auto;
}

.hero {
  background: var(--lbaldi-green-deep);
  color: var(--lbaldi-cream);
}

.hero-intro {
  display: grid;
  grid-template-columns: minmax(0, 0.98fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 6rem);
  padding-block: clamp(2.5rem, 6vw, 5.5rem);
}

.hero-copy {
  min-inline-size: 0;
}

h1,
h2 {
  margin: 0;
  font-family: var(--lbaldi-heading);
  font-weight: 700;
  overflow-wrap: break-word;
  text-wrap: balance;
}

h1 {
  font-size: clamp(3.15rem, 6.2vw, 5.4rem);
  line-height: 0.99;
  letter-spacing: -0.035em;
}

h1 span {
  display: block;
}

h1:lang(fr) {
  font-size: clamp(2.8rem, 5.9vw, 5.25rem);
}

h1:lang(ar) {
  line-height: 1.2;
  letter-spacing: normal;
}

.hero-copy p {
  margin-block: 1.15rem 1.55rem;
  font-size: clamp(1rem, 1.75vw, 1.25rem);
  line-height: 1.65;
}

.hero-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem 1.5rem;
}

.hero :focus-visible {
  outline-color: var(--lbaldi-cream);
}

.hero-photo {
  display: block;
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 1.06;
  object-fit: cover;
  border-radius: var(--photo-radius);
}

@media (prefers-reduced-motion: no-preference) {
  .hero-photo {
    animation: plate-arrival 500ms ease-out both;
  }
}

@keyframes plate-arrival {
  from {
    opacity: 0.78;
    transform: translateY(5px);
  }
}

.text-link {
  display: inline-flex;
  align-items: center;
  min-block-size: 44px;
  color: inherit;
  font-weight: 700;
  text-underline-offset: 0.28em;
}

.favourites {
  padding-block: clamp(2.8rem, 7vw, 6rem);
}

.favourites-intro {
  display: flex;
  align-items: end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-block-end: clamp(1.25rem, 3vw, 2rem);
}

h2 {
  font-size: clamp(2rem, 4vw, 3.7rem);
  line-height: 1.06;
  letter-spacing: -0.025em;
}

h2:lang(ar) {
  line-height: 1.25;
  letter-spacing: normal;
}

.favourites .text-link {
  color: var(--lbaldi-red);
}

.favourites-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.8rem, 2.5vw, 1.7rem);
  margin: 0;
  padding: 0;
  list-style: none;
}

.favourite-photo,
.story-photo {
  overflow: clip;
  border-radius: var(--photo-radius);
  background: var(--lbaldi-green-deep);
}

.favourite-photo {
  aspect-ratio: 1.7;
}

.favourite p {
  margin-block: 0;
  padding-block: 0.75rem;
  border-block-end: 1px solid var(--edge);
  font-weight: 700;
}

.story {
  scroll-margin-block-start: 1rem;
  padding-block: clamp(2.5rem, 6vw, 5rem);
  border-block-start: 1px solid var(--edge);
  background: var(--paper-toned);
}

.story-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(1.5rem, 5vw, 5rem);
}

.story-photo {
  aspect-ratio: 1.5;
}

.story-copy p {
  max-inline-size: 45ch;
  font-size: clamp(1rem, 1.8vw, 1.2rem);
  line-height: 1.7;
}

.story-copy .text-link {
  color: var(--lbaldi-red);
}

@media (max-width: 720px) {
  .hero-intro,
  .story-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-intro {
    gap: 1.45rem;
    padding-block: 2rem;
  }

  h1 {
    font-size: clamp(2.7rem, 10vw, 4.8rem);
  }

  h1:lang(fr) {
    font-size: clamp(2.35rem, 8.8vw, 4.4rem);
  }

  .hero-photo {
    aspect-ratio: 1.48;
  }

  .story-copy {
    grid-row: 1;
  }
}

@media (max-width: 500px) {
  .favourites-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .favourite {
    display: grid;
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
    align-items: center;
    gap: 1rem;
    border-block-end: 1px solid var(--edge);
    padding-block-end: 0.8rem;
  }

  .favourite p {
    border: 0;
  }
}
</style>
