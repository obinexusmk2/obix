import type { BiologicalControllerInput, Vector3 } from '../bioware/types';

const magnitude = (v: Vector3): number => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);

export const captureBiologicalInput = (
  partial: Partial<BiologicalControllerInput> = {},
): BiologicalControllerInput => {
  const base: BiologicalControllerInput = {
    forceVector: { x: 0, y: 0, z: 9.81 },
    accelerationVector: { x: 0, y: 0, z: 9.81 },
    userMassKg: 70,
    temperatureKelvin: 310.15,
    chemical: {
      pH: 7.4,
      glucoseMmolL: 5.5,
      oxygenPercent: 98,
    },
    electrical: {
      potentialMv: -70,
      currentMa: 0,
    },
  };

  return {
    ...base,
    ...partial,
    chemical: {
      ...base.chemical,
      ...partial.chemical,
    },
    electrical: {
      ...base.electrical,
      ...partial.electrical,
    },
  };
};

export const classifyBiologicalState = (input: BiologicalControllerInput): 'ALIVE' | 'DEAD' | 'SUPERPOSITION' => {
  const forceMag = magnitude(input.forceVector);

  if (forceMag <= 0.01) {
    return 'DEAD';
  }

  if (forceMag < 9.81) {
    return 'SUPERPOSITION';
  }

  return 'ALIVE';
};
