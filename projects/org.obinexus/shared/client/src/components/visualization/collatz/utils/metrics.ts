import { type Trajectory, type TrajectoryMetrics } from '../types';
  
  export const calculateTrajectoryMetrics = (trajectory: Trajectory): Omit<TrajectoryMetrics, 'number'> => {
    const values = trajectory.map(p => p.value);
    const probabilities = trajectory.map(p => p.probability);
    
    return {
      steps: trajectory.length,
      maxValue: Math.max(...values),
      averageValue: values.reduce((a, b) => a + b, 0) / values.length,
      stoppingTime: values.indexOf(1) !== -1 ? values.indexOf(1) : trajectory.length,
      evenCount: values.filter(v => v % 2 === 0).length,
      finalProbability: probabilities[probabilities.length - 1]
    };
  };