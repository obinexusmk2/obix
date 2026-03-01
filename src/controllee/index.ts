import { ControlSignal, Exoskeleton } from '../bioware/types';

export const STABILITY_THRESHOLD = 0.1;

export const executeControlSignal = (
  signal: ControlSignal,
  controllee: Exoskeleton
): 'ALIVE' | 'DEAD' | 'SUPERPOSITION' => {
  const minForce = controllee.mass * 9.8 * STABILITY_THRESHOLD;

  if (signal.command.newtons < minForce) {
    return 'DEAD';
  }

  if (signal.command.newtons > controllee.mass * 9.8) {
    return 'SUPERPOSITION';
  }

  const torque = signal.command.newtons * 0.5;
  controllee.joints.forEach((joint) => {
    joint.applyTorque(torque);
  });

  return 'ALIVE';
};
