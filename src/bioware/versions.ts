import { captureBiologicalInput } from '../controller';
import { translateToControlSignal } from '../control';
import { createControllee, executeControlSignal } from '../controllee';
import type { BiologicalControllerInput, ControlleeExecutionResult } from './types';

export type BiowareVersion = 'v1' | 'v2' | 'v3' | 'v4';

export type VersionOutput = {
  version: BiowareVersion;
  summary: string;
  execution?: ControlleeExecutionResult;
};

export const runBiowareV1 = (): VersionOutput => ({
  version: 'v1',
  summary: 'Controller layer created: biological input capture and tripolar classification.',
});

export const runBiowareV2 = (input: Partial<BiologicalControllerInput> = {}): VersionOutput => {
  const controller = captureBiologicalInput(input);
  const signal = translateToControlSignal(controller, 'v2-controllee');

  return {
    version: 'v2',
    summary: `Control layer created: generated ${signal.control.newtons.toFixed(2)}N command using F=ma.`,
  };
};

export const runBiowareV3 = (input: Partial<BiologicalControllerInput> = {}): VersionOutput => {
  const controller = captureBiologicalInput(input);
  const signal = translateToControlSignal(controller, 'v3-exoskeleton');
  const controllee = createControllee('v3-exoskeleton', 35, 4, 10);
  const execution = executeControlSignal(signal, controllee);

  return {
    version: 'v3',
    summary: 'Controllee layer created: control execution and 10% stability rule.',
    execution,
  };
};

export const runBiowareV4 = (input: Partial<BiologicalControllerInput> = {}): VersionOutput => {
  const controller = captureBiologicalInput(input);
  const signal = translateToControlSignal(controller, 'v4-exoskeleton');
  const controllee = createControllee('v4-exoskeleton', 45, 6, 10);
  const execution = executeControlSignal(signal, controllee);

  return {
    version: 'v4',
    summary: 'Integrated Bioware pipeline: controller -> control -> controllee.',
    execution,
  };
};

export const runBiowareSequence = (
  input: Partial<BiologicalControllerInput> = {},
): VersionOutput[] => [runBiowareV1(), runBiowareV2(input), runBiowareV3(input), runBiowareV4(input)];
