/**
 * BaseDataModel.ts
 *
 * Core data model abstractions for the DOP (Data-Oriented Programming) pattern.
 * Provides the DataModel interface and abstract base classes that concrete data
 * models extend. Implements Nnamdi Okpala's automaton state minimization technology
 * by requiring each model to produce a minimization signature.
 */

/**
 * Core interface all DOP data models must satisfy.
 * Self-referencing generic enforces the returning-self pattern.
 *
 * @template T The concrete data model type (self-reference)
 */
export interface DataModel<T extends DataModel<T>> {
  /**
   * Returns a deterministic string key that uniquely identifies this model's
   * current state for caching and automaton state minimization.
   */
  getMinimizationSignature(): string;

  /**
   * Returns an immutable copy of this model.
   */
  clone(): T;

  /**
   * Structural equality check based on minimization signatures.
   */
  equals(other: T): boolean;
}

/**
 * Abstract base class for all data models.
 * Provides a default `equals` implementation and enforces `clone` / signature.
 *
 * @template T The concrete derived type
 */
export abstract class BaseDataModel<T extends BaseDataModel<T>> implements DataModel<T> {
  abstract getMinimizationSignature(): string;
  abstract clone(): T;

  equals(other: T): boolean {
    return this.getMinimizationSignature() === other.getMinimizationSignature();
  }
}

/**
 * Abstract base for state-carrying data models.
 * Parameterised by both the concrete model type and the state shape.
 *
 * @template S The state shape (plain object / primitive)
 * @template T The concrete derived type
 */
export abstract class DataModelImpl<S, T extends DataModelImpl<S, T> = DataModelImpl<S, any>>
  extends BaseDataModel<T>
{
  protected state: S;

  constructor(initialState: S) {
    super();
    this.state = initialState;
  }

  /** Returns a shallow copy of the current state. */
  getState(): S {
    return typeof this.state === 'object' && this.state !== null
      ? { ...(this.state as object) } as unknown as S
      : this.state;
  }

  getMinimizationSignature(): string {
    return JSON.stringify(this.state);
  }
}
