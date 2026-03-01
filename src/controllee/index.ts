import type { ControlSignal } from '../control';

export interface Joint {
  id: string;
  applyTorque: (torque: number) => void;
}

export interface ArcReactor {
  output: number;
  temperature: number;
  stability: number;
}

export interface Exoskeleton {
  mass: number;
  joints: Joint[];
  powerSource: ArcReactor;
}

export const executeControlSignal = (
  signal: ControlSignal,
  controllee: Exoskeleton
): number => {
  const threshold = controllee.mass * 9.8 * 0.1;

  if (signal.command.newtons < threshold) {
    return 0;
  }

  const torque = signal.command.newtons * 0.5;
  controllee.joints.forEach(joint => joint.applyTorque(torque));
  return torque;
};
