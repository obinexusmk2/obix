// src/visualization/collatz/components/MetricRow.vue
<template>
  <div class="metric-row" :class="{ 'is-highlighted': highlight }">
    <div class="metric-row__label">
      <component 
        :is="icon" 
        class="metric-row__icon" 
        :size="16"
      />
      <span>{{ label }}:</span>
    </div>
    
    <div class="metric-row__value">
      <span>{{ value }}</span>
      
      <div v-if="trend" class="metric-row__trend" :class="trendClass">
        <component 
          :is="trendIcon" 
          class="trend-icon"
          :size="14"
        />
        <span class="trend-value">
          {{ trend.percentage.toFixed(1) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-vue-next';

interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
}

export default defineComponent({
  name: 'MetricRow',

  components: {
    ArrowUpRight,
    ArrowDownRight,
    Minus
  },

  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    trend: {
      type: Object as PropType<TrendData>,
      default: null
    },
    highlight: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    const trendClass = computed(() => {
      if (!props.trend) return '';
      return {
        'trend--up': props.trend.direction === 'up',
        'trend--down': props.trend.direction === 'down',
        'trend--neutral': props.trend.direction === 'neutral'
      };
    });

    const trendIcon = computed(() => {
      if (!props.trend) return null;
      switch (props.trend.direction) {
        case 'up': return 'ArrowUpRight';
        case 'down': return 'ArrowDownRight';
        default: return 'Minus';
      }
    });

    return {
      trendClass,
      trendIcon
    };
  }
});
</script>

<style lang="scss">
.metric-row {
  $highlight-color: rgba(59, 130, 246, 0.1);
  $transition-duration: 0.2s;

  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  transition: background-color $transition-duration ease;

  &.is-highlighted {
    background-color: #eff6ff;
    border-radius: 0.375rem;
    padding: 0 0.5rem;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #4b5563;
  }

  &__icon {
    color: #9ca3af;
  }

  &__value {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    
    &.trend--up {
      color: #059669;
    }
    
    &.trend--down {
      color: #dc2626;
    }
    
    &.trend--neutral {
      color: #9ca3af;
    }

    .trend-icon {
      margin-right: -0.25rem;
    }

    .trend-value {
      font-weight: 400;
    }
  }

  // Hover effects
  &:hover {
    .metric-row__icon {
      color: #3b82f6;
    }
  }
}
</style>