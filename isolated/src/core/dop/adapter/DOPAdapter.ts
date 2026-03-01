/**
 * DOPAdapter.ts
 *
 * Concrete implementation of the Data-Oriented Programming Adapter.
 * This class serves as a translation layer between functional and OOP programming
 * paradigms and implements Nnamdi Okpala's automaton state minimization technology.
 *
 * @author Implementation based on Nnamdi Okpala's design
 */

import { DataModel, DataModelImpl } from '../data/DataModel';
import { BehaviorModel, BehaviorModelImpl } from '../behavior/BehaviorModel';
import { ValidationResult } from '../validation/ValidationResult';
import { ExecutionTrace } from '../common/ExecutionTrace';
import { StateMachineMinimizer } from '../../automaton/minimizer/StateMachineMinimizer';

/**
 * Interface for the DOP Adapter
 *
 * @template T The data model type
 * @template R The result type
 */
export interface DOPAdapter<T extends DataModel<T>, R> {
  /** Gets the data model */
  getDataModel(): T;

  /** Gets the behavior model */
  getBehaviorModel(): BehaviorModel<T, R>;

  /**
   * Applies the behavior to the data model
   * @param data The data model to process
   * @returns The result of the operation
   */
  adapt(data: T): R;

  /** Enables or disables caching */
  setCachingEnabled(enabled: boolean): void;

  /** Clears the result cache */
  clearCache(): void;
}

/**
 * Concrete implementation of the DOP Adapter
 *
 * @template T The data model type
 * @template R The result type
 */
export class DOPAdapterImpl<T extends DataModel<T>, R> implements DOPAdapter<T, R> {
  /** The data model */
  protected _dataModel: T;

  /** The behavior model */
  protected _behaviorModel: BehaviorModel<T, R>;

  /** The state machine minimizer */
  protected _minimizer: StateMachineMinimizer;

  protected _cachingEnabled: boolean = false;

  /** Result cache for optimized processing */
  protected _resultCache: Map<string, R> = new Map();

  /** Whether execution tracing is enabled */
  protected _tracingEnabled: boolean = false;

  /** Execution traces for debugging and monitoring */
  protected _traces: ExecutionTrace[] = [];

  constructor(
    dataModel: T,
    behaviorModel: BehaviorModel<T, R>,
    options: {
      cachingEnabled?: boolean;
      tracingEnabled?: boolean;
      minimizer?: StateMachineMinimizer;
    } = {}
  ) {
    this._dataModel = dataModel;
    this._behaviorModel = behaviorModel;
    this._cachingEnabled = options.cachingEnabled ?? false;
    this._tracingEnabled = options.tracingEnabled ?? false;
    this._minimizer = options.minimizer ?? new StateMachineMinimizer();
    this.initialize();
  }

  protected initialize(): void {
    if (this._minimizer && typeof (this._minimizer as any).optimize === 'function') {
      try {
        (this._minimizer as any).optimize(this._behaviorModel);
      } catch (error) {
        console.error('Error during state minimization:', error);
      }
    }
  }

  public getDataModel(): T {
    return this._dataModel;
  }

  public getBehaviorModel(): BehaviorModel<T, R> {
    return this._behaviorModel;
  }

  public adapt(data: T): R {
    let trace: ExecutionTrace | undefined;
    if (this._tracingEnabled) {
      trace = ExecutionTrace.start('adapt', {
        behaviorId: this._behaviorModel.getBehaviorId(),
        dataSignature: data.getMinimizationSignature(),
      });
    }

    try {
      if (this._cachingEnabled) {
        const cacheKey = this.generateCacheKey(data);
        if (this._resultCache.has(cacheKey)) {
          if (trace) {
            trace.end({ success: true, cached: true });
            this._traces.push(trace);
          }
          return this._resultCache.get(cacheKey)!;
        }
      }

      const result = this._behaviorModel.process(data);

      if (this._cachingEnabled) {
        this._resultCache.set(this.generateCacheKey(data), result);
      }

      if (trace) {
        trace.end({ success: true, cached: false });
        this._traces.push(trace);
      }

      return result;
    } catch (error) {
      if (trace) {
        trace.end({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        this._traces.push(trace);
      }
      throw error;
    }
  }

  public setCachingEnabled(enabled: boolean): void {
    this._cachingEnabled = enabled;
    if (!enabled) this.clearCache();
  }

  public isCachingEnabled(): boolean {
    return this._cachingEnabled;
  }

  public clearCache(): void {
    this._resultCache.clear();
  }

  public setTracingEnabled(enabled: boolean): void {
    this._tracingEnabled = enabled;
    if (this._behaviorModel instanceof BehaviorModelImpl) {
      this._behaviorModel.setTracingEnabled(enabled);
    }
  }

  public isTracingEnabled(): boolean {
    return this._tracingEnabled;
  }

  public getTraces(): ExecutionTrace[] {
    return [...this._traces];
  }

  public clearTraces(): void {
    this._traces.length = 0;
    if (this._behaviorModel instanceof BehaviorModelImpl) {
      this._behaviorModel.clearTraces();
    }
  }

  public generateCacheKey(data: T): string {
    return `${this._behaviorModel.getBehaviorId()}:${data.getMinimizationSignature()}`;
  }

  /** Factory: functional paradigm adapter */
  public static createFunctional<S, T extends DataModelImpl<S, any>, R>(
    dataModel: T,
    transitions: Record<string, (state: S, payload?: unknown) => S>,
    processFunction: (data: T) => R,
    options: {
      behaviorId?: string;
      description?: string;
      cachingEnabled?: boolean;
      tracingEnabled?: boolean;
      minimizer?: StateMachineMinimizer;
    } = {}
  ): DOPAdapterImpl<T, R> {
    const behaviorModel = new BehaviorModelImpl<S, T, R>(
      options.behaviorId ?? 'functional-behavior',
      transitions,
      processFunction,
      {
        description: options.description ?? 'Functional programming behavior',
        tracingEnabled: options.tracingEnabled,
      }
    );
    return new DOPAdapterImpl<T, R>(dataModel, behaviorModel, {
      cachingEnabled: options.cachingEnabled,
      tracingEnabled: options.tracingEnabled,
      minimizer: options.minimizer,
    });
  }

  /** Factory: OOP paradigm adapter */
  public static createOOP<T extends DataModel<T>, R>(
    dataModel: T,
    component: Record<string, unknown>,
    options: {
      behaviorId?: string;
      description?: string;
      cachingEnabled?: boolean;
      tracingEnabled?: boolean;
      minimizer?: StateMachineMinimizer;
    } = {}
  ): DOPAdapterImpl<T, R> {
    const transitions = new Map<string, (data: unknown, payload?: unknown) => unknown>();
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(component))) {
      if (key === 'constructor' || key.startsWith('_')) continue;
      const value = component[key];
      if (typeof value === 'function') {
        transitions.set(key, (value as Function).bind(component));
      }
    }

    const behaviorModel = new BehaviorModelImpl<unknown, T, R>(
      options.behaviorId ?? 'oop-behavior',
      transitions as any,
      (data: T) => {
        if (typeof (component as any).process === 'function') {
          return (component as any).process(data);
        }
        return data as unknown as R;
      },
      {
        description: options.description ?? 'OOP behavior',
        tracingEnabled: options.tracingEnabled,
      }
    );

    return new DOPAdapterImpl<T, R>(dataModel, behaviorModel, {
      cachingEnabled: options.cachingEnabled,
      tracingEnabled: options.tracingEnabled,
      minimizer: options.minimizer,
    });
  }
}

/**
 * BaseDOPAdapter — backward-compatible alias.
 * Exported so files that import `BaseDOPAdapter from "./DOPAdapter"` still compile.
 */
export abstract class BaseDOPAdapter<T extends DataModel<T>, R> extends DOPAdapterImpl<T, R> {
  /** Subclasses override to provide custom result processing */
  public abstract adapt(data: T): R;
}

/**
 * Factory interface and base class for creating DOP adapters
 * (used by DuaParadigmFactory.ts and related consumers).
 */
export interface DualParadigmAdapterFactory<T extends DataModel<T>, R> {
  createFromFunctional(config: Record<string, unknown>): DOPAdapter<T, R>;
  createFromOOP(component: unknown): DOPAdapter<T, R>;
}

/** Re-export ValidationResult so adapter-layer callers can import it from here. */
export type { ValidationResult };
