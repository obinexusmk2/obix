

## Problem Statement

OBIX needs an API layer that serves as a bridge between application code and the core state minimization engine. This API must:

1. Support both functional programming and object-oriented programming paradigms with perfect 1:1 correspondence
2. Implement the Data-Oriented Programming Adapter pattern to separate data and behavior
3. Leverage automaton state minimization for optimal performance
4. Provide intuitive lifecycle hooks for components
5. Support seamless state transitions while maintaining type safety
6. Allow developers to use their preferred paradigm without performance penalties

The key challenge is designing an adapter layer that maintains the same capabilities, performance, and developer experience across both programming styles while leveraging the core optimization engine.

## UML Class Diagram for OBIX API

Here's a UML class diagram that illustrates the proposed API structure:

```mermaid
classDiagram
    ```mermaid
    %% Core API interfaces
    class Component {
        <<interface>>
        +state: any
        +trigger(event: string, payload?: any): void
        +subscribe(listener: (state: any) => void): () => void
        +mount(element: Element): void
        +unmount(): void
    }

    %% Functional API
    class FunctionalComponentFactory {
        +component<S, E extends string>(config: ComponentConfig<S, E>): FunctionalComponent<S, E>
    }

    class FunctionalComponent {
        +state: any
        +trigger(event: string, payload?: any): void
        +subscribe(listener: (state: any) => void): () => void
        +mount(element: Element): void
        +unmount(): void
    }

    class ComponentConfig {
        +initialState: any
        +transitions: Record<string, (state: any, payload?: any) => any>
        +render(state: any, trigger: (event: string, payload?: any) => void): any
        +hooks?: {
            onMount?: () => void
            onUpdate?: (prevState: any, newState: any) => void
            onUnmount?: () => void
        }
    }

    %% OOP API
    class BaseComponent {
        #adapter: DOPAdapter
        +initialState: any
        +state: any
        +trigger(event: string, payload?: any): void
        +subscribe(listener: (state: any) => void): () => void
        +mount(element: Element): void
        +unmount(): void
        +render(state: any): any
        #_onMount(): void
        #_onUpdate(prevState: any, newState: any): void
        #_onUnmount(): void
    }

    %% Core Adapter implementation
    class DOPAdapter {
        -dataModel: DataModel
        -behaviorModel: BehaviorModel
        -stateMachine: StateMachine
        -minimizer: StateMachineMinimizer
        +createFromFunctional(config: ComponentConfig): Component
        +createFromClass(componentClass: Class): Component
        +getState(): any
        +setState(state: any): void
        +applyTransition(name: string, payload: any): void
        +optimizeStateMachine(): void
        +triggerLifecycleHook(name: string, ...args: any[]): void
    }

    class DataModel {
        -state: any
        -transitionMap: Map<string, Function>
        +getState(): any
        +setState(newState: any): void
        +getTransitionMap(): Map<string, Function>
        +setTransitionMap(map: Map<string, Function>): void
    }

    class BehaviorModel {
        -eventHandlers: Map<string, Function>
        -lifecycleHooks: Map<string, Function>
        -renderFunction: Function
        +applyTransition(name: string, state: any, payload: any): any
        +handleEvent(name: string, payload: any): void
        +setRenderFunction(fn: Function): void
        +addLifecycleHook(name: string, fn: Function): void
        +removeLifecycleHook(name: string): void
    }

    %% State Machine
    class StateMachine {
        -states: Map<string, State>
        -currentState: State
        -equivalenceClasses: Map<number, Set<State>>
        +addState(id: string, value: any): State
        +getState(id: string): State
        +transition(event: string, payload: any): State
        +optimize(): StateMachine
    }

    class State {
        -id: string
        -value: any
        -transitions: Map<string, State>
        -metadata: StateMetadata
        +getValue(): any
        +getTransitions(): Map<string, State>
        +computeSignature(): string
    }

    class StateMachineMinimizer {
        +minimize(stateMachine: StateMachine): StateMachine
        -computeEquivalenceClasses(stateMachine: StateMachine): Map<number, Set<State>>
        -optimizeTransitions(stateMachine: StateMachine): void
    }
    

    %% Relationships
    Component <|.. FunctionalComponent : implements
    Component <|.. BaseComponent : implements
    FunctionalComponentFactory --> FunctionalComponent : creates
    FunctionalComponent --> ComponentConfig : uses
    FunctionalComponent --> DOPAdapter : uses
    BaseComponent --> DOPAdapter : uses
    DOPAdapter o-- DataModel : contains
    DOPAdapter o-- BehaviorModel : contains
    DOPAdapter --> StateMachine : uses
    DOPAdapter --> StateMachineMinimizer : uses
    StateMachine o-- State : contains
    StateMachineMinimizer --> StateMachine : optimizes
    ```
```

## API Design Documentation

Based on the UML diagram, here's a detailed description of the API design and how it implements the required functionality:

### Core Interface

The `Component` interface defines the contract that both functional and OOP components must implement. This ensures consistency across paradigms and allows for interchangeable use.

### Functional API

The functional API leverages the factory pattern through the `component()` function, which takes a configuration object containing:

1. **initialState**: The initial component state
2. **transitions**: A map of named transitions that transform the state
3. **render**: Function that renders the component based on current state
4. **hooks**: Optional lifecycle hooks for advanced usage

Example usage:

```typescript
import { component } from 'obix';

const Counter = component({
  initialState: { count: 0 },
  transitions: {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 })
  },
  render: (state, trigger) => (
    <div>
      <button onClick={() => trigger('decrement')}>-</button>
      <span>{state.count}</span>
      <button onClick={() => trigger('increment')}>+</button>
    </div>
  ),
  hooks: {
    onMount: () => console.log('Counter mounted'),
    onUpdate: (prev, next) => console.log(`Count changed from ${prev.count} to ${next.count}`),
    onUnmount: () => console.log('Counter unmounted')
  }
});
```

### OOP API

The OOP API uses class inheritance through `BaseComponent`, which internally uses the same adapter as the functional API:

1. **Component methods**: Defined on the base class to implement the `Component` interface
2. **Lifecycle hooks**: Protected methods that can be overridden by subclasses
3. **Protected adapter**: Manages state and optimization through the same adapter

Example usage:

```typescript
import { Component } from 'obix';

class Counter extends Component {
  initialState = { count: 0 };
  
  increment(state) {
    return { count: state.count + 1 };
  }
  
  decrement(state) {
    return { count: state.count - 1 };
  }
  
  render(state) {
    return (
      <div>
        <button onClick={() => this.trigger('decrement')}>-</button>
        <span>{state.count}</span>
        <button onClick={() => this.trigger('increment')}>+</button>
      </div>
    );
  }
  
  _onMount() {
    console.log('Counter mounted');
  }
  
  _onUpdate(prev, next) {
    console.log(`Count changed from ${prev.count} to ${next.count}`);
  }
  
  _onUnmount() {
    console.log('Counter unmounted');
  }
}
```

### Data-Oriented Programming Adapter

The `DOPAdapter` class is the central piece that implements the pattern:

1. **Data Model**: Immutable state and transition definitions
2. **Behavior Model**: Event handlers, lifecycle hooks, and rendering logic
3. **State Machine**: Internal representation for optimization
4. **State Minimizer**: Applies automaton minimization algorithms

The adapter translates between the two programming paradigms, ensuring they have identical behavior and performance. It handles:

1. Creating components from both paradigms
2. Managing component state
3. Applying transitions
4. Optimizing the state machine
5. Coordinating lifecycle hooks

### State Machine Optimization

The state minimization engine works by:

1. Representing component states as automaton states
2. Computing equivalence classes to identify redundant states
3. Merging equivalent states to reduce memory and computation
4. Optimizing transition paths for faster state changes

This approach dramatically improves performance for complex applications with many state transitions.

## Implementation Recommendations

To implement this API effectively:

1. Start with the core `Component` interface and `DOPAdapter` implementation
2. Implement the functional API first, as it more directly maps to the adapter
3. Build the OOP API on top of the adapter, ensuring consistent behavior
4. Focus on type safety with TypeScript generics for state and event types
5. Implement extensive testing for 1:1 correspondence between paradigms
6. Document both APIs thoroughly with examples of each pattern

This architecture will provide a robust foundation for the OBIX project, allowing developers to choose their preferred programming style while benefiting from the advanced state minimization technology.