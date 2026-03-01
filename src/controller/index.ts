export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ChemicalState {
  pH: number;
  glucose: number;
  oxygen: number;
}

export interface BioelectricState {
  potential: number;
  current: number;
}

export interface BiologicalController {
  force: Vector3;
  temperature: number;
  chemical: ChemicalState;
  electrical: BioelectricState;
}

export const captureBiologicalInput = (): BiologicalController => ({
  force: { x: 0, y: 0, z: 9.8 },
  temperature: 310.15,
  chemical: { pH: 7.4, glucose: 5.5, oxygen: 98 },
  electrical: { potential: -70, current: 0 }
});
