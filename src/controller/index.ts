import type { BiologicalController } from '../types/bioware';

export const captureBiologicalInput = (): BiologicalController => ({
  force: { x: 0, y: 0, z: 9.8 },
  temperature: 310.15,
  chemical: { pH: 7.4, glucose: 5.5, oxygen: 98 },
  electrical: { potential: -70, current: 0 },
});
