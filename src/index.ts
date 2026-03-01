/**
 * OBIX Bioware entrypoint
 */

import {
  captureBiologicalInput,
  type BiologicalController,
  type BioelectricState,
  type ChemicalState,
  type Vector3
} from './controller';
import {
  F_MA,
  translateToControlSignal,
  type ControlSignal,
  type Force
} from './control';
import {
  executeControlSignal,
  type ArcReactor,
  type Exoskeleton,
  type Joint
} from './controllee';

export {
  ArcReactor,
  BioelectricState,
  BiologicalController,
  captureBiologicalInput,
  ChemicalState,
  ControlSignal,
  executeControlSignal,
  Exoskeleton,
  F_MA,
  Force,
  Joint,
  translateToControlSignal,
  Vector3
};

export const runBiowareCycle = (exoskeleton: Exoskeleton): number => {
  const input = captureBiologicalInput();
  const signal = translateToControlSignal(input, exoskeleton.mass);
  return executeControlSignal(signal, exoskeleton);
};
