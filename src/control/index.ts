import {
  BiologicalController,
  ControlSignal,
  ForceSignal,
  Vector3
} from '../bioware/types';

export const forceFromMassAcceleration = (
  mass: number,
  acceleration: Vector3
): ForceSignal => {
  const magnitude = Math.sqrt(
    acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
  );

  return {
    newtons: mass * magnitude,
    vector: acceleration,
    timestamp: Date.now()
  };
};

export const translateToControlSignal = (
  input: BiologicalController,
  targetMass: number,
  target = 'exoskeleton'
): ControlSignal => ({
  controller: input,
  command: forceFromMassAcceleration(targetMass, input.force),
  target
});
