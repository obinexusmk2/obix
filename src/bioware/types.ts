export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type TripolarState = 'ALIVE' | 'DEAD' | 'SUPERPOSITION';

export type ChemicalState = {
  pH: number;
  glucoseMmolL: number;
  oxygenPercent: number;
};

export type BioelectricState = {
  potentialMv: number;
  currentMa: number;
};

export type BiologicalControllerInput = {
  forceVector: Vector3;
  accelerationVector: Vector3;
  userMassKg: number;
  temperatureKelvin: number;
  chemical: ChemicalState;
  electrical: BioelectricState;
};

export type ForceCommand = {
  newtons: number;
  vector: Vector3;
  source: 'F=ma';
};

export type ControlSignal = {
  controller: BiologicalControllerInput;
  control: ForceCommand;
  controlleeId: string;
  state: TripolarState;
};

export type JointState = {
  id: string;
  torqueApplied: number;
};

export type Controllee = {
  id: string;
  massKg: number;
  joints: JointState[];
  stabilityThresholdPercent: number;
};

export type ControlleeExecutionResult = {
  controlleeId: string;
  actioned: boolean;
  tripolar: TripolarState;
  reason: string;
  updatedJoints: JointState[];
};
