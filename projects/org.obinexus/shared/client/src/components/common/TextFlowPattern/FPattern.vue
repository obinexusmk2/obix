// FPatternLayout.vue
<script lang="ts">
import { defineComponent, ref } from 'vue'

interface Section {
  mainContent: string
  sidebarContent: string
  hasDropCap?: boolean
}

interface ContentData {
  header: string
  sections: Section[]
}

export default defineComponent({
  name: 'FPatternLayout',
  
  props: {
    initialLoading: {
      type: Boolean,
      default: true
    },
    content: {
      type: Object as () => ContentData,
      required: true
    }
  },

  setup(props) {
    const isLoading = ref(props.initialLoading)

    const toggleLoading = () => {
      isLoading.value = !isLoading.value
    }

    const renderSkeleton = () => {
      return Array(2).fill(null).map(() => ({
        mainContent: '',
        sidebarContent: ''
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
  <div class="f-pattern">
    <div class="controls">
      <button class="toggle-button" @click="toggleLoading">
        Toggle Loading State
      </button>
    </div>

    <template v-if="isLoading">
      <div class="f-pattern__header skeleton">
        <div class="skeleton-text"></div>
        <div class="skeleton-text"></div>
      </div>
      
      <div 
        v-for="(_, index) in renderSkeleton()" 
        :key="'skeleton-' + index"
        class="f-pattern__section"
      >
        <div class="f-pattern__content">
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
        <div class="f-pattern__sidebar">
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="f-pattern__header">
        <h1>{{ content.header }}</h1>
      </div>

      <div 
        v-for="(section, index) in content.sections" 
        :key="'content-' + index"
        class="f-pattern__section"
      >
        <div 
          class="f-pattern__content"
          :class="{ 'with-drop-cap': section.hasDropCap }"
        >
          {{ section.mainContent }}
        </div>
        <div class="f-pattern__sidebar">
          {{ section.sidebarContent }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
:root {
  /* Color palette from theme.css */
  --primary-red: #F71735;
  --secondary-purple: #594157;
  --tertiary-teal: #046865;
  --accent-orange: #F18F01;
  --highlight-blue: #1170FF;
  
  /* Text colors */
  --text-primary: var(--secondary-purple-dark);
  --text-secondary: var(--secondary-purple);
  --text-muted: rgba(89, 65, 87, 0.7);
  
  /* Background colors */
  --background-primary: #ffffff;
  --background-secondary: #f8f9fa;
  --background-tertiary: #f1f3f5;
  
  /* Spacing */
  --spacing-base: 1rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
}

.f-pattern {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.f-pattern__header {
  padding: var(--spacing-lg);
  background: var(--secondary-purple);
  color: white;
  border-radius: 8px;
  margin-bottom: var(--spacing-lg);
}

.f-pattern__section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.f-pattern__content {
  padding: var(--spacing-lg);
  background: var(--background-secondary);
  border-radius: 8px;
}

.f-pattern__sidebar {
  padding: var(--spacing-lg);
  background: var(--background-tertiary);
  border-radius: 8px;
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
    #f0f0f0 25%,
    #f8f8f8 50%,
    #f0f0f0 75%
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
}

.toggle-button {
  padding: 0.75rem 1.5rem;
  background: var(--secondary-purple);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-button:hover {
  background: var(--secondary-purple-dark);
}

@media (max-width: 768px) {
  .f-pattern__section {
    grid-template-columns: 1fr;
  }
}
</style>