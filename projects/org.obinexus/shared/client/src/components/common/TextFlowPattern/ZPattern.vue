// ZPattern.vue
<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'

interface ZSection {
  leftContent: string
  rightContent: string
  hasDropCap?: boolean
  backgroundStyle?: string
}

interface ZContent {
  title: string
  sections: ZSection[]
}

export default defineComponent({
  name: 'ZPatternLayout',
  
  props: {
    initialLoading: {
      type: Boolean,
      default: true
    },
    content: {
      type: Object as PropType<ZContent>,
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
        leftContent: '',
        rightContent: ''
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
    class="z-pattern" 
    :class="theme"
    role="region" 
    aria-label="Z-Pattern Content Layout"
  >
    <div class="controls">
      <button 
        class="toggle-button" 
        @click="toggleLoading"
        aria-pressed="isLoading"
      >
        Toggle Loading State
      </button>
    </div>

    <template v-if="isLoading">
      <div class="z-pattern__title skeleton" aria-hidden="true">
        <div class="skeleton-text"></div>
      </div>
      
      <div 
        v-for="(_, index) in renderSkeleton()" 
        :key="'skeleton-' + index"
        class="z-pattern__section"
        aria-hidden="true"
      >
        <div class="z-pattern__content left">
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
        <div class="z-pattern__content right">
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="z-pattern__title">
        <h1>{{ content.title }}</h1>
      </div>

      <div 
        v-for="(section, index) in content.sections" 
        :key="'content-' + index"
        class="z-pattern__section"
      >
        <div 
          class="z-pattern__content left"
          :class="{ 'with-drop-cap': section.hasDropCap }"
          :style="section.backgroundStyle"
        >
          {{ section.leftContent }}
        </div>
        <div 
          class="z-pattern__content right"
          :class="{ 'with-drop-cap': section.hasDropCap }"
          :style="section.backgroundStyle"
        >
          {{ section.rightContent }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.z-pattern {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  font-family: var(--font-family-primary);
}

.z-pattern__title {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  color: var(--text-primary);
}

.z-pattern__section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  position: relative;
}

.z-pattern__section::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 25%;
  right: 25%;
  height: 2px;
  background: linear-gradient(
    to right, 
    transparent, 
    var(--secondary-purple), 
    transparent
  );
  transform: rotate(-15deg);
  opacity: 0.2;
  pointer-events: none;
}

.z-pattern__content {
  padding: var(--spacing-lg);
  background: var(--background-secondary);
  border-radius: 8px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.z-pattern__content:hover {
  transform: translateY(-4px);
}

.z-pattern__content.left {
  text-align: left;
}

.z-pattern__content.right {
  text-align: right;
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
  transition: background-color 0.2s, transform 0.2s;
}

.toggle-button:hover {
  background: var(--secondary-purple-dark);
  transform: translateY(-2px);
}

.toggle-button:focus {
  outline: 2px solid var(--highlight-blue);
  outline-offset: 2px;
}

/* Theme variations */
.z-pattern.dark {
  --background-primary: #1a202c;
  --background-secondary: #2d3748;
  --text-primary: #f8f9fa;
  --skeleton-start: #2d3748;
  --skeleton-middle: #4a5568;
}

.z-pattern.light {
  --background-primary: #ffffff;
  --background-secondary: #f8f9fa;
  --text-primary: #2d3748;
  --skeleton-start: #f0f0f0;
  --skeleton-middle: #f8f8f8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .z-pattern__section {
    grid-template-columns: 1fr;
  }
  
  .z-pattern__section::after {
    display: none;
  }
  
  .z-pattern__content.right {
    text-align: left;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .z-pattern__content,
  .toggle-button {
    transition: none;
  }
  
  .skeleton {
    animation: none;
    background: var(--skeleton-start);
  }
}
</style>