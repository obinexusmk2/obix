// src/visualization/collatz/types/index.ts
export interface TrajectoryPoint {
    value: number;
    probability: number;
  }
  
  export interface Trajectory extends Array<TrajectoryPoint> {}
  
  export interface TrajectoryMetrics {
    number: number;
    steps: number;
    maxValue: number;
    averageValue: number;
    stoppingTime: number;
    evenCount: number;
    finalProbability: number;
  }