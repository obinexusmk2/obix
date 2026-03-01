import { classifyBiologicalState } from '../controller';
import type { BiologicalControllerInput, ControlSignal, ForceCommand, Vector3 } from '../bioware/types';

const magnitude = (v: Vector3): number => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);

export const computeForce = (massKg: number, accelerationVector: Vector3): ForceCommand => {
  return {
    newtons: massKg * magnitude(accelerationVector),
    vector: accelerationVector,
    source: 'F=ma',
  };
};

export const applyTenPercentStabilityRule = (forceNewtons: number, thresholdNewtons: number): boolean => {
  return forceNewtons >= thresholdNewtons * 0.1;
};

export const translateToControlSignal = (
  controller: BiologicalControllerInput,
  controlleeId: string,
): ControlSignal => {
  const control = computeForce(controller.userMassKg, controller.accelerationVector);
  const state = classifyBiologicalState(controller);

  return {
    controller,
    control,
    controlleeId,
    state,
  };
};
