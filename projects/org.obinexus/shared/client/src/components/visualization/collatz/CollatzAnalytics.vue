<template>
  <div class="p-6">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Trajectory Analytics</h3>
      <div class="flex items-center space-x-4">
        <div class="stats">
          <span class="stat-label">Total Trajectories:</span>
          <span class="stat-value">{{ metrics.length }}</span>
        </div>
        <div class="stats">
          <span class="stat-label">Avg Stopping Time:</span>
          <span class="stat-value">{{ avgStoppingTime }}</span>
        </div>
        <div v-if="isQuantum" class="stats">
          <span class="stat-label">Quantum Success Rate:</span>
          <span class="stat-value">{{ quantumSuccessRate }}%</span>
        </div>
      </div>
      </div>
      <div class="card-content">
        <template v-if="hasTrajectories">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <trajectory-card
              v-for="metric in metrics"
              :key="metric.number"
              :metric="metric"
              :is-quantum="isQuantum"
            />
          </div>
        </template>
        <div v-else class="text-center text-gray-500">
          No trajectories to analyze
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import TrajectoryCard from './TragactoryCard.vue';
import { type Trajectory, type TrajectoryMetrics } from './types';
import { calculateTrajectoryMetrics } from './utils/metrics';

export default defineComponent({
  name: 'CollatzAnalytics',
  
  components: {
    TrajectoryCard
  },

  props: {
    trajectories: {
      type: Object as PropType<Record<string, Trajectory[]>>,
      required: true
    },
    isQuantum: {
      type: Boolean,
      default: false
    }
  },

  setup(props) {
    const hasTrajectories = computed(() => {
      return Object.keys(props.trajectories).length > 0;
    });

    const metrics = computed(() => {
      return Object.entries(props.trajectories).map(([num, traj]) => ({
        number: parseInt(num),
        ...calculateTrajectoryMetrics(traj)
      }));
    });

    return {
      hasTrajectories,
      metrics
    };
  }
});
</script>
<style scoped lang="scss">
.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.card-header {
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.card-title {
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.stats {
  display: flex;
  align-items: center;
}

.stat-label {
  color: #4a5568;
  font-size: 0.875rem;
  font-weight: 500;
}

.stat-value {
  color: #2d3748;
  font-size: 1.125rem;
  font-weight: 600;
}
</style>
