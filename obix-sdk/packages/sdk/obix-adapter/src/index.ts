/**
 * OBIX DP Adapter - Main Entry Point
 * Data-oriented paradigm translation layer for OBIX
 */

export { DOPAdapter } from "./dop-adapter";
export { ReactiveWrapper } from "./reactive";

export type {
  Action,
  ActionContext,
  AdapterConfig,
  ComponentLogic,
  FunctionalComponent,
  OOPComponentClass,
  ReactiveComponent,
  TransformResult,
} from "./types";

export { Paradigm } from "./types";
