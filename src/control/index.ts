import type { BiologicalController, ControlSignal, ForceSignal, Vector3 } from '../types/bioware';

export const magnitude = (vector: Vector3): number => {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
};

export const F_MA = (mass: number, acceleration: Vector3): ForceSignal => ({
  newtons: mass * magnitude(acceleration),
  vector: acceleration,
  timestamp: Date.now(),
});

export const translateToControlSignal = (
  input: BiologicalController,
  targetMass: number,
  target = 'exoskeleton'
): ControlSignal => ({
  controller: input,
  command: F_MA(targetMass, input.force),
  target,
});
