import type { BiologicalController, Vector3 } from '../controller';

export interface Force {
  newtons: number;
  vector: Vector3;
  timestamp: number;
}

export interface ControlSignal {
  controller: BiologicalController;
  command: Force;
  target: string;
}

export const F_MA = (mass: number, acceleration: Vector3): Force => {
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
  command: F_MA(targetMass, input.force),
  target
});
