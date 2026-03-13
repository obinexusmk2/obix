<!-- TextFlowPattern.vue -->
<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'

interface BaseSection {
  hasDropCap?: boolean
  backgroundStyle?: string
}

interface FSection extends BaseSection {
  mainContent: string
  sidebarContent: string
}

interface ZSection extends BaseSection {
  leftContent: string
  rightContent: string
}

interface TSection extends BaseSection {
  headerContent: string
  mainContent: string
}

interface ContentData {
  title: string
  sections: (FSection | ZSection | TSection)[]
  pattern: 'F' | 'T' | 'Z'
}

export default defineComponent({
  name: 'TextFlowPattern',
  
  props: {
    initialLoading: {
      type: Boolean,
      default: true
    },
    content: {
      type: Object as PropType<ContentData>,
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
      return Array(2).fill(null).map(() => {
        switch (props.content.pattern) {
          case 'F':
            return { mainContent: '', sidebarContent: '' }
          case 'Z':
            return { leftContent: '', rightContent: '' }
          case 'T':
            return { headerContent: '', mainContent: '' }
        }
      })
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
    :class="['text-flow-pattern', content.pattern.toLowerCase(), theme]"
    role="region" 
    :aria-label="`${content.pattern}-Pattern Content Layout`"
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

    <template v-if="isLoading">
      <!-- Skeleton Loading -->
      <div class="pattern-title skeleton" aria-hidden="true">
        <div class="skeleton-text"></div>
      </div>
      
      <div 
        v-for="(_, index) in renderSkeleton()" 
        :key="'skeleton-' + index"
        class="pattern-section"
        aria-hidden="true"
      >
        <!-- F-Pattern Skeleton -->
        <template v-if="content.pattern === 'F'">
          <div class="pattern-content main">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
          <div class="pattern-content sidebar">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </template>

        <!-- Z-Pattern Skeleton -->
        <template v-else-if="content.pattern === 'Z'">
          <div class="pattern-content left">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
          <div class="pattern-content right">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </template>

        <!-- T-Pattern Skeleton -->
        <template v-else>
          <div class="pattern-content header">
            <div class="skeleton-text"></div>
          </div>
          <div class="pattern-content main">
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </template>
      </div>
    </template>

    <template v-else>
      <div class="pattern-title">
        <h1>{{ content.title }}</h1>
      </div>

      <!-- F-Pattern Content -->
      <template v-if="content.pattern === 'F'">
        <div 
          v-for="(section, index) in content.sections" 
          :key="'f-content-' + index"
          class="pattern-section"
        >
          <div 
            class="pattern-content main"
            :class="{ 'with-drop-cap': section.hasDropCap }"
            :style="section.backgroundStyle"
          >
            {{ (section as FSection).mainContent }}
          </div>
          <div class="pattern-content sidebar">
            {{ (section as FSection).sidebarContent }}
          </div>
        </div>
      </template>

      <!-- Z-Pattern Content -->
      <template v-else-if="content.pattern === 'Z'">
        <div 
          v-for="(section, index) in content.sections" 
          :key="'z-content-' + index"
          class="pattern-section"
        >
          <div 
            class="pattern-content left"
            :class="{ 'with-drop-cap': section.hasDropCap }"
            :style="section.backgroundStyle"
          >
            {{ (section as ZSection).leftContent }}
          </div>
          <div 
            class="pattern-content right"
            :class="{ 'with-drop-cap': section.hasDropCap }"
            :style="section.backgroundStyle"
          >
            {{ (section as ZSection).rightContent }}
          </div>
        </div>
      </template>

      <!-- T-Pattern Content -->
      <template v-else>
        <div 
          v-for="(section, index) in content.sections" 
          :key="'t-content-' + index"
          class="pattern-section"
        >
          <div 
            class="pattern-content header"
            :class="{ 'with-drop-cap': section.hasDropCap }"
            :style="section.backgroundStyle"
          >
            {{ (section as TSection).headerContent }}
          </div>
          <div class="pattern-content main">
            {{ (section as TSection).mainContent }}
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.text-flow-pattern {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  font-family: var(--font-family-primary);
}

.pattern-title {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  color: var(--text-primary);
}

.pattern-section {
  margin-bottom: var(--spacing-xl);
  position: relative;
}

.pattern-content {
  padding: var(--spacing-lg);
  background: var(--background-secondary);
  border-radius: 8px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* F-Pattern specific styles */
.f .pattern-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
}

/* Z-Pattern specific styles */
.z .pattern-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.z .pattern-section::after {
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

/* T-Pattern specific styles */
.t .pattern-section {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--spacing-lg);
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

/* Theme variations */
.dark {
  --background-primary: #1a202c;
  --background-secondary: #2d3748;
  --text-primary: #f8f9fa;
  --skeleton-start: #2d3748;
  --skeleton-middle: #4a5568;
}

.light {
  --background-primary: #ffffff;
  --background-secondary: #f8f9fa;
  --text-primary: #2d3748;
  --skeleton-start: #f0f0f0;
  --skeleton-middle: #f8f8f8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .f .pattern-section,
  .z .pattern-section {
    grid-template-columns: 1fr;
  }
  
  .z .pattern-section::after {
    display: none;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .pattern-content,
  .toggle-button {
    transition: none;
  }
  
  .skeleton {
    animation: none;
    background: var(--skeleton-start);
  }
}
</style>