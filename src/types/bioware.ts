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

export interface Bioelectric {
  potential: number;
  current: number;
}

export interface BiologicalController {
  force: Vector3;
  temperature: number;
  chemical: ChemicalState;
  electrical: Bioelectric;
}

export interface ForceSignal {
  newtons: number;
  vector: Vector3;
  timestamp: number;
}

export interface ControlSignal {
  controller: BiologicalController;
  command: ForceSignal;
  target: string;
}

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
