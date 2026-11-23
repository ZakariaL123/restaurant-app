<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import LbaldiPhoto from '../components/LbaldiPhoto.vue'
import { useLanguage } from '../i18n'
import { dishName } from '../utils/dishText'

const { language, t } = useLanguage()

const favourites = [
  { frame: 'tagine', name: 'Chicken Tagine' },
  { frame: 'couscous', name: 'Vegetable Couscous' },
  { frame: 'tea', name: 'Moroccan Mint Tea' },
] as const

const featuredDish = ref<(typeof favourites)[number]>(favourites[0])
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
            <RouterLink class="button button--order" :to="{ name: 'menu' }">
              {{ t('exploreMenu') }}
            </RouterLink>
            <RouterLink class="text-link" :to="{ name: 'home', hash: '#our-story' }">
              {{ t('ourStory') }}
            </RouterLink>
          </div>
        </div>
        <div class="tasting-board">
          <figure id="featured-dish" class="featured-dish">
            <div class="plate-frame">
              <div :key="featuredDish.frame" class="plate-image" aria-hidden="true">
                <img
                  v-if="featuredDish.frame === 'tagine'"
                  class="hero-photo"
                  src="/dishes/chicken-tagine.jpg"
                  alt=""
                  width="612"
                  height="612"
                  fetchpriority="high"
                />
                <LbaldiPhoto v-else :frame="featuredDish.frame" />
              </div>
            </div>
            <figcaption class="plate-caption" aria-live="polite">
              {{ dishName(featuredDish.name, language) }}
            </figcaption>
          </figure>
          <div class="tasting-choices" role="group" :aria-label="t('houseFavourites')">
            <button
              v-for="dish in favourites"
              :key="dish.frame"
              type="button"
              class="tasting-choice"
              :aria-pressed="featuredDish.frame === dish.frame"
              aria-controls="featured-dish"
              @click="featuredDish = dish"
            >
              <span class="choice-image"><LbaldiPhoto :frame="dish.frame" /></span>
              <span>{{ dishName(dish.name, language) }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section id="our-story" class="story" aria-labelledby="story-title">
      <div class="page-width story-layout">
        <div class="story-photo"><LbaldiPhoto frame="tea" /></div>
        <div class="story-copy">
          <h2 id="story-title">{{ t('ourStory') }}</h2>
          <p>{{ t('storyText') }}</p>
          <RouterLink class="text-link" :to="{ name: 'menu' }">{{ t('viewFullMenu') }}</RouterLink>
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
  background: var(--paper);
  color: var(--ink);
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

.tasting-board {
  --plate-radius: 18% 18% 0.55rem 0.55rem / 14% 14% 0.55rem 0.55rem;
  min-inline-size: 0;
}

.featured-dish {
  position: relative;
  isolation: isolate;
  margin: 0 0 1.25rem;
}

.featured-dish::before {
  position: absolute;
  z-index: -1;
  inset-block: 0.45rem -0.45rem;
  inset-inline: 0.45rem -0.45rem;
  border: 1px solid var(--edge);
  border-radius: var(--plate-radius);
  content: '';
}

.plate-frame {
  aspect-ratio: 1.34;
  overflow: clip;
  border-radius: var(--plate-radius);
  background: var(--ink);
}

.plate-image,
.hero-photo {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

.hero-photo {
  object-fit: cover;
  object-position: 50% 57%;
}

.plate-caption {
  position: absolute;
  inset-block-end: clamp(0.65rem, 2vw, 1.25rem);
  inset-inline-start: clamp(0.65rem, 2vw, 1.25rem);
  max-inline-size: calc(100% - 2rem);
  padding: 0.55rem 0.8rem;
  border-radius: 0.3rem;
  background: var(--lbaldi-cream);
  color: var(--lbaldi-green-deep);
  font-family: var(--lbaldi-heading);
  font-size: clamp(1rem, 1.8vw, 1.35rem);
  font-weight: 700;
}

.tasting-choices {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.4rem, 1.25vw, 0.9rem);
}

.tasting-choice {
  display: grid;
  align-content: start;
  gap: 0.4rem;
  min-block-size: 44px;
  min-inline-size: 0;
  padding: 0.35rem;
  border: 1px solid var(--field-edge);
  border-radius: 0.48rem;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.3;
  text-align: start;
  overflow-wrap: break-word;
  cursor: pointer;
}

.tasting-choice:hover {
  background: var(--paper-toned);
}

.tasting-choice[aria-pressed='true'] {
  border-color: var(--lbaldi-green);
  background: var(--lbaldi-green);
  color: var(--lbaldi-cream);
}

.choice-image {
  block-size: clamp(2rem, 4vw, 3.25rem);
  overflow: clip;
  border-radius: 0.25rem;
}

@media (prefers-reduced-motion: no-preference) {
  .plate-image {
    animation: plate-reveal 360ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
  }
}

@keyframes plate-reveal {
  from {
    clip-path: inset(0 0 16%);
    opacity: 0.62;
    transform: scale(1.045);
  }

  to {
    clip-path: inset(0);
    opacity: 1;
    transform: scale(1);
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

h2 {
  font-size: clamp(2rem, 4vw, 3.7rem);
  line-height: 1.06;
  letter-spacing: -0.025em;
}

h2:lang(ar) {
  line-height: 1.25;
  letter-spacing: normal;
}

.story-photo {
  aspect-ratio: 1.5;
  overflow: clip;
  border-radius: var(--photo-radius);
  background: var(--lbaldi-green-deep);
}

.story {
  scroll-margin-block-start: 1rem;
  padding-block: clamp(2.5rem, 6vw, 5rem);
  border-block-start: 1px solid var(--edge);
  background: var(--lbaldi-green);
  color: var(--lbaldi-cream);
}

.story-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(1.5rem, 5vw, 5rem);
}

.story-copy p {
  max-inline-size: 45ch;
  font-size: clamp(1rem, 1.8vw, 1.2rem);
  line-height: 1.7;
}

.story :focus-visible {
  outline-color: var(--lbaldi-cream);
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

  .plate-frame {
    aspect-ratio: 1.55;
  }

  .story-copy {
    grid-row: 1;
  }
}
</style>
