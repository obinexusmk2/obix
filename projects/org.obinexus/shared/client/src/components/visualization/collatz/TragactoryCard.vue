// src/visualization/collatz/components/TrajectoryCard.vue
<template>
  <div class="trajectory-card" :class="{ 'is-quantum': isQuantum }">
    <div class="trajectory-card__header">
      <h4 class="trajectory-card__title">
        Starting Number: {{ metric.number }}
      </h4>
      <div class="trajectory-card__badge" :class="statusClass">
        {{ getStatusText() }}
      </div>
    </div>

    <div class="trajectory-card__content">
      <div class="trajectory-card__metrics">
        <metric-row label="Steps" :value="metric.steps" icon="steps" />
        <metric-row 
          label="Max Value" 
          :value="formatNumber(metric.maxValue)"
          icon="peak"
          :trend="getTrend('maxValue')"
        />
        <metric-row 
          label="Average Value" 
          :value="formatNumber(Math.round(metric.averageValue))"
          icon="average"
          :trend="getTrend('averageValue')"
        />
        <metric-row 
          label="Stopping Time" 
          :value="metric.stoppingTime"
          icon="timer"
          :highlight="isOptimalStoppingTime"
        />
        <metric-row 
          label="Even Numbers" 
          :value="`${Math.round((metric.evenCount / metric.steps) * 100)}%`"
          icon="ratio"
          :highlight="hasGoodEvenRatio"
        />
        
        <template v-if="isQuantum">
          <div class="trajectory-card__quantum-section">
            <h5 class="trajectory-card__subtitle">Quantum Metrics</h5>
            <metric-row 
              label="Final Probability" 
              :value="`${(metric.finalProbability * 100).toFixed(2)}%`"
              icon="probability"
              :highlight="hasHighProbability"
            />
            <div class="trajectory-card__probability-gauge">
              <div 
                class="probability-fill"
                :style="{ width: `${metric.finalProbability * 100}%` }"
              ></div>
            </div>
          </div>
        </template>
      </div>

      <div class="trajectory-card__actions">
        <button 
          class="action-button"
          @click="$emit('view-details', metric.number)"
        >
          View Details
        </button>
        <button 
          class="action-button action-button--secondary"
          @click="$emit('export-data', metric.number)"
        >
          Export Data
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import MetricRow from './MetricRow.vue';
import { type TrajectoryMetrics } from '../types';

interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
}

export default defineComponent({
  name: 'TrajectoryCard',

  components: {
    MetricRow
  },

  props: {
    metric: {
      type: Object as PropType<TrajectoryMetrics>,
      required: true
    },
    isQuantum: {
      type: Boolean,
      default: false
    },
    previousMetric: {
      type: Object as PropType<TrajectoryMetrics>,
      default: null
    }
  },

  emits: ['view-details', 'export-data'],

  setup(props) {
    const formatNumber = (num: number): string => {
      return num.toLocaleString();
    };

    const statusClass = computed(() => {
      if (props.metric.stoppingTime <= 50) return 'status--optimal';
      if (props.metric.stoppingTime <= 100) return 'status--good';
      return 'status--long';
    });

    const isOptimalStoppingTime = computed(() => {
      return props.metric.stoppingTime <= 50;
    });

    const hasGoodEvenRatio = computed(() => {
      const evenRatio = props.metric.evenCount / props.metric.steps;
      return evenRatio >= 0.4 && evenRatio <= 0.6;
    });

    const hasHighProbability = computed(() => {
      return props.isQuantum && props.metric.finalProbability > 0.8;
    });

    const getTrend = (metricKey: keyof TrajectoryMetrics): TrendData | null => {
      if (!props.previousMetric) return null;

      const currentValue = props.metric[metricKey] as number;
      const previousValue = props.previousMetric[metricKey] as number;
      const difference = currentValue - previousValue;
      const percentage = (difference / previousValue) * 100;

      return {
        value: Math.abs(difference),
        direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral',
        percentage: Math.abs(percentage)
      };
    };

    const getStatusText = () => {
      if (props.metric.stoppingTime <= 50) return 'Optimal';
      if (props.metric.stoppingTime <= 100) return 'Good';
      return 'Long Path';
    };

    return {
      formatNumber,
      statusClass,
      isOptimalStoppingTime,
      hasGoodEvenRatio,
      hasHighProbability,
      getTrend,
      getStatusText
    };
  }
});
</script>

<style lang="scss" scoped>
@use 'sass:math';

$base-spacing: 1rem;
$border-radius: 0.5rem;
$transition-duration: 0.3s;

.trajectory-card {
  
  background-color: white;
  border-radius: $border-radius;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: transform $transition-duration ease, box-shadow $transition-duration ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &.is-quantum {
    background: linear-gradient(to bottom right, #f0f7ff, #f6f0ff);
    
    .trajectory-card__header {
      background: linear-gradient(to right, #e1effe, #e9e1ff);
    }
  }

  &__header {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 500;
    margin: 0;
  }

  &__badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    
    &.status--optimal {
      background-color: #dcfce7;
      color: #166534;
    }
    
    &.status--good {
      background-color: #dbeafe;
      color: #1e40af;
    }
    
    &.status--long {
      background-color: #fef9c3;
      color: #854d0e;
    }
  }

  &__content {
    padding: 1rem;
  }

  &__metrics {
    > * + * {
      margin-top: 1rem;
    }
  }

  &__quantum-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  &__subtitle {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }

  &__probability-gauge {
    margin-top: 0.5rem;
    height: 0.5rem;
    background-color: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;

    .probability-fill {
      height: 100%;
      background-color: #3b82f6;
      transition: width $transition-duration ease;
    }
  }

  &__actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.5rem;
  }
}

.action-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:not(.action-button--secondary) {
    background-color: #f3f4f6;
    color: #374151;
    
    &:hover {
      background-color: #1d4ed8;
      color: white;
    }
  }

  &--secondary {
    background-color: #f3f4f6;
    color: #374151;
    
    &:hover {
      background-color: #e5e7eb;
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .trajectory-card {
    &__header {
      flex-direction: column;
      align-items: flex-start;
      gap: $base-spacing;
    }

    &__actions {
      flex-direction: column;
    }
  }
}

</style>