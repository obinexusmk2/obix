import { applyTenPercentStabilityRule } from '../control';
import type { ControlSignal, Controllee, ControlleeExecutionResult, JointState } from '../bioware/types';

const applyTorqueToJoints = (joints: JointState[], torque: number): JointState[] => {
  return joints.map((joint) => ({
    ...joint,
    torqueApplied: joint.torqueApplied + torque,
  }));
};

export const createControllee = (
  id: string,
  massKg: number,
  jointCount: number,
  stabilityThresholdPercent = 10,
): Controllee => {
  return {
    id,
    massKg,
    stabilityThresholdPercent,
    joints: Array.from({ length: jointCount }, (_, index) => ({
      id: `${id}-joint-${index + 1}`,
      torqueApplied: 0,
    })),
  };
};

export const executeControlSignal = (
  signal: ControlSignal,
  controllee: Controllee,
): ControlleeExecutionResult => {
  const forceThreshold = controllee.massKg * 9.81;
  const stable = applyTenPercentStabilityRule(signal.control.newtons, forceThreshold);

  if (!stable) {
    return {
      controlleeId: controllee.id,
      actioned: false,
      tripolar: 'DEAD',
      reason: 'Below 10% stability threshold',
      updatedJoints: controllee.joints,
    };
  }

  const torque = signal.control.newtons * 0.5;
  const updatedJoints = applyTorqueToJoints(controllee.joints, torque);

  return {
    controlleeId: controllee.id,
    actioned: true,
    tripolar: signal.state === 'DEAD' ? 'SUPERPOSITION' : signal.state,
    reason: 'Control signal executed',
    updatedJoints,
  };
};
