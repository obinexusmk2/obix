import type { ControlSignal, Exoskeleton } from '../types/bioware';

export interface ControlExecutionResult {
  status: 'ignored' | 'executed';
  reason?: string;
  torque?: number;
}

export const executeControlSignal = (
  signal: ControlSignal,
  controllee: Exoskeleton
): ControlExecutionResult => {
  const gravityBaseline = controllee.mass * 9.8;
  const stabilityThreshold = gravityBaseline * 0.1;

  if (signal.command.newtons < stabilityThreshold) {
    return {
      status: 'ignored',
      reason: 'Below the 10% stability threshold.',
    };
  }

  const torque = signal.command.newtons * 0.5;
  controllee.joints.forEach((joint) => {
    joint.applyTorque(torque);
  });

  return {
    status: 'executed',
    torque,
  };
};
