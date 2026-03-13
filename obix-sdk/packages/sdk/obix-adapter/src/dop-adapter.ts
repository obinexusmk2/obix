/**
 * OBIX DP Adapter - Main Adapter Class
 * Translates between programming paradigms: data-oriented ↔ functional ↔ OOP ↔ reactive
 */

import type {
  ComponentLogic,
  FunctionalComponent,
  OOPComponentClass,
  ReactiveComponent,
  TransformResult,
  Paradigm,
  ActionContext,
} from "./types";
import { Paradigm as ParadigmEnum } from "./types";
import { ReactiveWrapper } from "./reactive";

/**
 * DOPAdapter<S>
 * The core adapter class that handles paradigm transformations
 * Works with any component logic and converts it to different paradigms
 */
export class DOPAdapter<S extends Record<string, any> = Record<string, any>> {
  private logic: ComponentLogic<S>;

  constructor(logic: ComponentLogic<S>) {
    this.logic = logic;
  }

  /**
   * Transform to Functional paradigm
   * Creates a function-based component using closures for state management
   */
  toFunctional(): FunctionalComponent<S> {
    const { state, actions, render } = this.logic;

    return function FunctionalComponent() {
      let currentState = JSON.parse(JSON.stringify(state));

      const context: ActionContext<S> = {
        state: currentState,
        ...Object.keys(actions).reduce(
          (acc, key) => {
            acc[key] = (...args: any[]) => {
              actions[key]({ ...context, state: currentState }, ...args);
            };
            return acc;
          },
          {} as Record<string, any>
        ),
      };

      return render(context);
    };
  }

  /**
   * Transform to OOP paradigm
   * Creates a class-based component with state properties and action methods
   */
  toOOP(): OOPComponentClass<S> {
    const { state, actions, render } = this.logic;

    return class OOPComponent {
      state: S;

      constructor() {
        this.state = JSON.parse(JSON.stringify(state));

        // Bind all actions as methods
        Object.keys(actions).forEach((key) => {
          (this as any)[key] = (...args: any[]) => {
            const context: ActionContext<S> = {
              state: this.state,
              ...actions,
            };
            actions[key](context, ...args);
          };
        });
      }

      render(): any {
        const context: ActionContext<S> = {
          state: this.state,
          ...actions,
        };
        return render(context);
      }
    } as OOPComponentClass<S>;
  }

  /**
   * Transform to Reactive paradigm
   * Creates an observable component with subscriptions and action dispatch
   */
  toReactive(): ReactiveComponent<S> {
    return new ReactiveWrapper(this.logic);
  }

  /**
   * Transform to Data-Oriented paradigm
   * Returns a normalized version of the component logic (identity transform)
   */
  toDataOriented(): ComponentLogic<S> {
    return {
      name: this.logic.name,
      state: JSON.parse(JSON.stringify(this.logic.state)),
      actions: { ...this.logic.actions },
      render: this.logic.render,
      metadata: this.logic.metadata
        ? JSON.parse(JSON.stringify(this.logic.metadata))
        : undefined,
    };
  }

  /**
   * Generic transform dispatcher
   * Routes to the appropriate transformation method based on target paradigm
   */
  transform(target: Paradigm): TransformResult<S> {
    const timestamp = Date.now();

    switch (target) {
      case ParadigmEnum.FUNCTIONAL:
        return {
          paradigm: ParadigmEnum.FUNCTIONAL,
          component: this.toFunctional(),
          metadata: {
            source: ParadigmEnum.DATA_ORIENTED,
            timestamp,
          },
        };

      case ParadigmEnum.OOP:
        return {
          paradigm: ParadigmEnum.OOP,
          component: this.toOOP(),
          metadata: {
            source: ParadigmEnum.DATA_ORIENTED,
            timestamp,
          },
        };

      case ParadigmEnum.REACTIVE:
        return {
          paradigm: ParadigmEnum.REACTIVE,
          component: this.toReactive(),
          metadata: {
            source: ParadigmEnum.DATA_ORIENTED,
            timestamp,
          },
        };

      case ParadigmEnum.DATA_ORIENTED:
        return {
          paradigm: ParadigmEnum.DATA_ORIENTED,
          component: this.toDataOriented(),
          metadata: {
            source: ParadigmEnum.DATA_ORIENTED,
            timestamp,
          },
        };

      default:
        throw new Error(`Unknown target paradigm: ${target}`);
    }
  }

  /**
   * Static factory method: Create adapter from any paradigm
   * Reverse-adapts from functional, OOP, or reactive back to data-oriented
   *
   * @param input - The component in its source paradigm
   * @param sourceParadigm - The paradigm of the input component
   * @returns A DOPAdapter with normalized data-oriented logic
   */
  static fromAny<T extends Record<string, any> = Record<string, any>>(
    input: any,
    sourceParadigm: Paradigm
  ): DOPAdapter<T> {
    let logic: ComponentLogic<T>;

    switch (sourceParadigm) {
      case ParadigmEnum.DATA_ORIENTED:
        // Already in data-oriented form
        logic = input as ComponentLogic<T>;
        break;

      case ParadigmEnum.FUNCTIONAL:
        // Extract logic from functional component
        // This is a simplified extraction - functional components lose metadata
        logic = {
          name: input.name || "FunctionalComponent",
          state: {},
          actions: {},
          render: input,
        } as ComponentLogic<T>;
        break;

      case ParadigmEnum.OOP:
        // Extract logic from class-based component
        const instance = new input();
        logic = {
          name: input.name || "OOPComponent",
          state: instance.state || {},
          actions: Object.keys(instance)
            .filter((key) => typeof instance[key] === "function" && key !== "render")
            .reduce(
              (acc, key) => {
                acc[key] = (ctx: ActionContext<T>) => instance[key]();
                return acc;
              },
              {} as Record<string, any>
            ),
          render: (ctx: ActionContext<T>) => instance.render(),
        } as ComponentLogic<T>;
        break;

      case ParadigmEnum.REACTIVE:
        // Extract logic from reactive component
        const reactive = input as ReactiveComponent<T>;
        logic = {
          name: "ReactiveComponent",
          state: JSON.parse(JSON.stringify(reactive.state)),
          actions: {},
          render: (ctx: ActionContext<T>) => ctx.state,
        } as ComponentLogic<T>;
        break;

      default:
        throw new Error(`Unknown source paradigm: ${sourceParadigm}`);
    }

    return new DOPAdapter(logic);
  }
}
