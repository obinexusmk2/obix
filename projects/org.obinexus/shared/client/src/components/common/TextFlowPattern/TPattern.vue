<!-- TPattern.vue -->
<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'

interface TSection {
  headerContent: string
  mainContent: string
  hasDropCap?: boolean
  backgroundStyle?: string
  columnLayout?: 'single' | 'double' | 'triple'
  accent?: boolean
}

interface TContent {
  title: string
  sections: TSection[]
  theme?: 'light' | 'dark'
}

export default defineComponent({
  name: 'TPattern',
  
  props: {
    initialLoading: {
      type: Boolean,
      default: true
    },
    content: {
      type: Object as PropType<TContent>,
      required: true
    },
    theme: {
      type: String,
      default: 'light',
      validator: (value: string) => ['light', 'dark'].includes(value)
    }
  },

  setup(props, { emit }) {
    const isLoading = ref(props.initialLoading)

    const toggleLoading = () => {
      isLoading.value = !isLoading.value
      emit('loading-changed', isLoading.value)
    }

    const renderSkeleton = () => {
      return Array(2).fill(null).map(() => ({
        headerContent: '',
        mainContent: '',
        columnLayout: 'single'
      }))
    }

    return {
      isLoading,
      toggleLoading,
      renderSkeleton
    }
  }
})
</script>

<template>
  <div 
    class="t-pattern"
    :class="[theme, { 'is-loading': isLoading }]"
    role="region" 
    aria-label="T-Pattern Content Layout"
  >
    <div class="controls">
      <button 
        class="toggle-button" 
        @click="toggleLoading"
        :aria-pressed="isLoading"
      >
        Toggle Loading State
      </button>
    </div>

    <div class="t-pattern__container">
      <!-- Title Header -->
      <header class="t-pattern__title" :class="{ skeleton: isLoading }">
        <template v-if="!isLoading">
          <h1>{{ content.title }}</h1>
        </template>
        <template v-else>
          <div class="skeleton-text"></div>
        </template>
      </header>

      <!-- Content Sections -->
      <div class="t-pattern__sections">
        <template v-if="isLoading">
          <div 
            v-for="(_, index) in renderSkeleton()" 
            :key="'skeleton-' + index"
            class="t-pattern__section"
          >
            <div class="t-pattern__header skeleton">
              <div class="skeleton-text"></div>
            </div>
            <div class="t-pattern__content skeleton">
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
        </template>

        <template v-else>
          <div 
            v-for="(section, index) in content.sections" 
            :key="'section-' + index"
            class="t-pattern__section"
            :class="[
              `columns-${section.columnLayout || 'single'}`,
              { 'with-accent': section.accent }
            ]"
          >
            <div 
              class="t-pattern__header"
              :class="{ 'with-drop-cap': section.hasDropCap }"
              :style="section.backgroundStyle"
            >
              {{ section.headerContent }}
            </div>
            
            <div 
              class="t-pattern__content"
              :style="section.backgroundStyle"
            >
              <div class="t-pattern__content-inner">
                {{ section.mainContent }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.t-pattern {
  --header-height: 200px;
  --section-gap: 2rem;
  --content-padding: 2rem;
  
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  font-family: var(--font-family-primary);
}

.t-pattern__container {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}

/* Title Styling */
.t-pattern__title {
  text-align: center;
  padding: 2rem;
  margin-bottom: var(--section-gap);
  border-radius: 8px;
  background: var(--background-secondary);
}

.t-pattern__title h1 {
  font-size: 2.5rem;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

/* Section Styling */
.t-pattern__section {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
  margin-bottom: var(--section-gap);
}

.t-pattern__header {
  padding: var(--content-padding);
  background: var(--background-secondary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.t-pattern__content {
  padding: var(--content-padding);
  background: var(--background-tertiary);
  border-radius: 8px;
  color: var(--text-secondary);
  line-height: 1.6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Column Layouts */
.t-pattern__section.columns-double .t-pattern__content-inner {
  column-count: 2;
  column-gap: 2rem;
}

.t-pattern__section.columns-triple .t-pattern__content-inner {
  column-count: 3;
  column-gap: 2rem;
}

/* Accent Styling */
.t-pattern__section.with-accent .t-pattern__header {
  background: var(--primary-red);
  color: white;
}

/* Drop cap styling */
.with-drop-cap::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  padding-right: 0.1em;
  color: var(--primary-red);
  font-weight: bold;
}

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--skeleton-start) 25%,
    var(--skeleton-middle) 50%,
    var(--skeleton-start) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-text {
  height: 1em;
  margin-bottom: 0.5em;
  border-radius: 4px;
}

.skeleton-text:nth-child(2) { width: 95%; }
.skeleton-text:nth-child(3) { width: 85%; }

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Controls */
.controls {
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.toggle-button {
  padding: 0.75rem 1.5rem;
  background: var(--secondary-purple);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background: var(--secondary-purple-dark);
  transform: translateY(-2px);
}

/* Theme Variations */
.t-pattern.dark {
  --background-primary: #1a202c;
  --background-secondary: #2d3748;
  --background-tertiary: #4a5568;
  --text-primary: #f8f9fa;
  --text-secondary: #e2e8f0;
  --skeleton-start: #2d3748;
  --skeleton-middle: #4a5568;
}

.t-pattern.light {
  --background-primary: #ffffff;
  --background-secondary: #f8f9fa;
  --background-tertiary: #f1f3f5;
  --text-primary: #2d3748;
  --text-secondary: #4a5568;
  --skeleton-start: #f0f0f0;
  --skeleton-middle: #f8f8f8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .t-pattern__section.columns-double .t-pattern__content-inner,
  .t-pattern__section.columns-triple .t-pattern__content-inner {
    column-count: 1;
  }

  .t-pattern__title h1 {
    font-size: 2rem;
  }

  .t-pattern__header {
    font-size: 1.25rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .t-pattern *,
  .toggle-button {
    transition: none !important;
  }
  
  .skeleton {
    animation: none;
    background: var(--skeleton-start);
  }
}
</style>