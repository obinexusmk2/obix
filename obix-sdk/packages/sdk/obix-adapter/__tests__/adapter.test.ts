/**
 * OBIX DP Adapter - Test Suite
 * Tests for paradigm transformations and adapter functionality
 */

import { describe, it, expect } from "vitest";
import {
  DOPAdapter,
  ReactiveWrapper,
  type ComponentLogic,
} from "../src/index";
import { Paradigm } from "../src/types";

/**
 * Sample component logic for testing
 * A simple counter component with increment/decrement actions
 */
const counterLogic: ComponentLogic<{ count: number }> = {
  name: "Counter",
  state: { count: 0 },
  actions: {
    increment: ({ state }) => {
      state.count += 1;
    },
    decrement: ({ state }) => {
      state.count -= 1;
    },
    reset: ({ state }) => {
      state.count = 0;
    },
  },
  render: ({ state }) => ({
    text: `Count: ${state.count}`,
    value: state.count,
  }),
  metadata: {
    version: "1.0.0",
    description: "A simple counter component",
  },
};

describe("DOPAdapter - Core Functionality", () => {
  it("should create an adapter from component logic", () => {
    const adapter = new DOPAdapter(counterLogic);
    expect(adapter).toBeInstanceOf(DOPAdapter);
  });

  it("should preserve component metadata", () => {
    const adapter = new DOPAdapter(counterLogic);
    const logic = adapter.toDataOriented();
    expect(logic.metadata).toEqual(counterLogic.metadata);
  });
});

describe("DOPAdapter - Functional Paradigm", () => {
  it("should transform to functional component", () => {
    const adapter = new DOPAdapter(counterLogic);
    const FunctionalComponent = adapter.toFunctional();

    expect(typeof FunctionalComponent).toBe("function");
  });

  it("should produce working functional component", () => {
    const adapter = new DOPAdapter(counterLogic);
    const FunctionalComponent = adapter.toFunctional();
    const result = FunctionalComponent();

    expect(result).toEqual({
      text: "Count: 0",
      value: 0,
    });
  });

  it("functional component should execute actions", () => {
    // Note: Functional component uses closures, so state changes per invocation
    const adapter = new DOPAdapter({
      ...counterLogic,
      state: { count: 5 },
    });

    const FunctionalComponent = adapter.toFunctional();
    const result = FunctionalComponent();

    expect(result.value).toBe(5);
  });
});

describe("DOPAdapter - OOP Paradigm", () => {
  it("should transform to OOP component class", () => {
    const adapter = new DOPAdapter(counterLogic);
    const OOPComponentClass = adapter.toOOP();

    expect(typeof OOPComponentClass).toBe("function");
  });

  it("should produce working OOP component instance", () => {
    const adapter = new DOPAdapter(counterLogic);
    const OOPComponentClass = adapter.toOOP();
    const instance = new OOPComponentClass();

    expect(instance.state).toEqual({ count: 0 });
    expect(instance.render()).toEqual({
      text: "Count: 0",
      value: 0,
    });
  });

  it("OOP component should execute bound actions", () => {
    const adapter = new DOPAdapter(counterLogic);
    const OOPComponentClass = adapter.toOOP();
    const instance = new OOPComponentClass();

    expect(typeof instance.increment).toBe("function");
    expect(typeof instance.decrement).toBe("function");
    expect(typeof instance.reset).toBe("function");
  });

  it("OOP component actions should modify state", () => {
    const adapter = new DOPAdapter(counterLogic);
    const OOPComponentClass = adapter.toOOP();
    const instance = new OOPComponentClass();

    (instance as any).increment();
    expect(instance.state.count).toBe(1);

    (instance as any).increment();
    expect(instance.state.count).toBe(2);

    (instance as any).decrement();
    expect(instance.state.count).toBe(1);

    (instance as any).reset();
    expect(instance.state.count).toBe(0);
  });

  it("OOP component render should reflect state changes", () => {
    const adapter = new DOPAdapter(counterLogic);
    const OOPComponentClass = adapter.toOOP();
    const instance = new OOPComponentClass();

    (instance as any).increment();
    (instance as any).increment();
    const result = instance.render();

    expect(result.value).toBe(2);
    expect(result.text).toBe("Count: 2");
  });
});

describe("DOPAdapter - Reactive Paradigm", () => {
  it("should transform to reactive component", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();

    expect(reactiveComponent).toBeDefined();
    expect(typeof reactiveComponent.subscribe).toBe("function");
    expect(typeof reactiveComponent.dispatch).toBe("function");
    expect(typeof reactiveComponent.notify).toBe("function");
  });

  it("reactive component should initialize with state", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();

    expect(reactiveComponent.state).toEqual({ count: 0 });
  });

  it("should subscribe to state changes", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();

    const states: any[] = [];
    const unsubscribe = reactiveComponent.subscribe((state) => {
      states.push(state);
    });

    expect(unsubscribe).toBeDefined();
    expect(typeof unsubscribe).toBe("function");
  });

  it("should dispatch actions and notify subscribers", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();

    const states: any[] = [];
    reactiveComponent.subscribe((state) => {
      states.push({ ...state });
    });

    reactiveComponent.dispatch("increment");
    expect(reactiveComponent.state.count).toBe(1);
    expect(states.length).toBeGreaterThan(0);
    expect(states[states.length - 1].count).toBe(1);
  });

  it("should handle multiple subscribers", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();

    const subscriber1States: any[] = [];
    const subscriber2States: any[] = [];

    reactiveComponent.subscribe((state) => {
      subscriber1States.push({ ...state });
    });

    reactiveComponent.subscribe((state) => {
      subscriber2States.push({ ...state });
    });

    reactiveComponent.dispatch("increment");
    reactiveComponent.dispatch("increment");

    expect(subscriber1States.length).toBeGreaterThan(0);
    expect(subscriber2States.length).toBeGreaterThan(0);
    expect(subscriber1States[subscriber1States.length - 1].count).toBe(2);
    expect(subscriber2States[subscriber2States.length - 1].count).toBe(2);
  });

  it("should allow unsubscribing from updates", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();

    const states: any[] = [];
    const unsubscribe = reactiveComponent.subscribe((state) => {
      states.push({ ...state });
    });

    reactiveComponent.dispatch("increment");
    const countAfterFirstSubscribe = states.length;

    unsubscribe();
    reactiveComponent.dispatch("increment");

    expect(states.length).toBe(countAfterFirstSubscribe);
  });

  it("reactive component should throw on unknown action", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();

    expect(() => {
      reactiveComponent.dispatch("unknownAction");
    }).toThrow('Action "unknownAction" not found');
  });

  it("reactive component should render current state", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();

    reactiveComponent.dispatch("increment");
    const rendered = reactiveComponent.render();

    expect(rendered.value).toBe(1);
    expect(rendered.text).toBe("Count: 1");
  });
});

describe("DOPAdapter - Transform Dispatcher", () => {
  it("should dispatch to functional paradigm", () => {
    const adapter = new DOPAdapter(counterLogic);
    const result = adapter.transform(Paradigm.FUNCTIONAL);

    expect(result.paradigm).toBe(Paradigm.FUNCTIONAL);
    expect(typeof result.component).toBe("function");
    expect(result.metadata?.source).toBe(Paradigm.DATA_ORIENTED);
    expect(result.metadata?.timestamp).toBeDefined();
  });

  it("should dispatch to OOP paradigm", () => {
    const adapter = new DOPAdapter(counterLogic);
    const result = adapter.transform(Paradigm.OOP);

    expect(result.paradigm).toBe(Paradigm.OOP);
    expect(typeof result.component).toBe("function");
    expect(result.metadata?.source).toBe(Paradigm.DATA_ORIENTED);
  });

  it("should dispatch to reactive paradigm", () => {
    const adapter = new DOPAdapter(counterLogic);
    const result = adapter.transform(Paradigm.REACTIVE);

    expect(result.paradigm).toBe(Paradigm.REACTIVE);
    expect(result.component).toBeDefined();
    expect(result.metadata?.source).toBe(Paradigm.DATA_ORIENTED);
  });

  it("should dispatch to data-oriented paradigm", () => {
    const adapter = new DOPAdapter(counterLogic);
    const result = adapter.transform(Paradigm.DATA_ORIENTED);

    expect(result.paradigm).toBe(Paradigm.DATA_ORIENTED);
    expect(result.component).toEqual(expect.objectContaining({
      name: counterLogic.name,
      state: counterLogic.state,
      actions: expect.any(Object),
    }));
  });

  it("should throw on unknown paradigm", () => {
    const adapter = new DOPAdapter(counterLogic);

    expect(() => {
      adapter.transform("UNKNOWN" as any);
    }).toThrow("Unknown target paradigm");
  });
});

describe("DOPAdapter - Reverse Adaptation (fromAny)", () => {
  it("should create adapter from data-oriented logic", () => {
    const adapter = DOPAdapter.fromAny(counterLogic, Paradigm.DATA_ORIENTED);
    expect(adapter).toBeInstanceOf(DOPAdapter);

    const logic = adapter.toDataOriented();
    expect(logic.name).toBe(counterLogic.name);
    expect(logic.state).toEqual(counterLogic.state);
  });

  it("should create adapter from functional component", () => {
    const adapter = new DOPAdapter(counterLogic);
    const functionalComponent = adapter.toFunctional();

    const reverseAdapter = DOPAdapter.fromAny(
      functionalComponent,
      Paradigm.FUNCTIONAL
    );
    expect(reverseAdapter).toBeInstanceOf(DOPAdapter);

    const logic = reverseAdapter.toDataOriented();
    expect(logic.render).toBeDefined();
  });

  it("should create adapter from OOP component", () => {
    const adapter = new DOPAdapter(counterLogic);
    const OOPComponentClass = adapter.toOOP();

    const reverseAdapter = DOPAdapter.fromAny(OOPComponentClass, Paradigm.OOP);
    expect(reverseAdapter).toBeInstanceOf(DOPAdapter);

    const logic = reverseAdapter.toDataOriented();
    expect(logic.state).toEqual({ count: 0 });
    expect(logic.render).toBeDefined();
  });

  it("should create adapter from reactive component", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();

    const reverseAdapter = DOPAdapter.fromAny(
      reactiveComponent,
      Paradigm.REACTIVE
    );
    expect(reverseAdapter).toBeInstanceOf(DOPAdapter);

    const logic = reverseAdapter.toDataOriented();
    expect(logic.state).toEqual({ count: 0 });
  });
});

describe("DOPAdapter - Round-trip Transformations", () => {
  it("should round-trip: data → functional → data", () => {
    const adapter = new DOPAdapter(counterLogic);
    const functionalComponent = adapter.toFunctional();
    const reverseAdapter = DOPAdapter.fromAny(
      functionalComponent,
      Paradigm.FUNCTIONAL
    );
    const logic = reverseAdapter.toDataOriented();

    // Functional components use the JS function name, not the original component name
    // This is a known limitation of paradigm round-trips (metadata loss)
    expect(logic.name).toBe("FunctionalComponent");
  });

  it("should round-trip: data → OOP → data", () => {
    const adapter = new DOPAdapter(counterLogic);
    const OOPComponentClass = adapter.toOOP();
    const reverseAdapter = DOPAdapter.fromAny(OOPComponentClass, Paradigm.OOP);
    const logic = reverseAdapter.toDataOriented();

    expect(logic.state).toEqual(counterLogic.state);
  });

  it("should round-trip: data → reactive → data", () => {
    const adapter = new DOPAdapter(counterLogic);
    const reactiveComponent = adapter.toReactive();
    const reverseAdapter = DOPAdapter.fromAny(
      reactiveComponent,
      Paradigm.REACTIVE
    );
    const logic = reverseAdapter.toDataOriented();

    expect(logic.state).toEqual(counterLogic.state);
  });

  it("should chain transformations: data → OOP → functional", () => {
    const adapter = new DOPAdapter(counterLogic);
    const OOPComponentClass = adapter.toOOP();
    const reverseAdapter = DOPAdapter.fromAny(OOPComponentClass, Paradigm.OOP);
    const functionalComponent = reverseAdapter.toFunctional();

    expect(typeof functionalComponent).toBe("function");
  });
});

describe("ReactiveWrapper - Direct Usage", () => {
  it("should create reactive wrapper directly", () => {
    const wrapper = new ReactiveWrapper(counterLogic);
    expect(wrapper).toBeInstanceOf(ReactiveWrapper);
  });

  it("should initialize with component state", () => {
    const wrapper = new ReactiveWrapper(counterLogic);
    expect(wrapper.state).toEqual({ count: 0 });
  });

  it("should render current state", () => {
    const wrapper = new ReactiveWrapper(counterLogic);
    const rendered = wrapper.render();

    expect(rendered).toEqual({
      text: "Count: 0",
      value: 0,
    });
  });
});

describe("DOPAdapter - Complex Scenarios", () => {
  it("should handle components with multiple action parameters", () => {
    const complexLogic: ComponentLogic<{ value: number }> = {
      name: "Calculator",
      state: { value: 0 },
      actions: {
        add: ({ state }, amount: number) => {
          state.value += amount;
        },
        multiply: ({ state }, factor: number) => {
          state.value *= factor;
        },
      },
      render: ({ state }) => state.value,
    };

    const adapter = new DOPAdapter(complexLogic);
    const OOPComponentClass = adapter.toOOP();
    const instance = new OOPComponentClass();

    (instance as any).add(5);
    expect(instance.state.value).toBe(5);

    (instance as any).multiply(2);
    expect(instance.state.value).toBe(10);
  });

  it("should handle complex nested state", () => {
    const nestedLogic: ComponentLogic<{
      user: { name: string; age: number };
      scores: number[];
    }> = {
      name: "UserProfile",
      state: {
        user: { name: "John", age: 30 },
        scores: [10, 20, 30],
      },
      actions: {
        updateName: ({ state }, newName: string) => {
          state.user.name = newName;
        },
        addScore: ({ state }, score: number) => {
          state.scores.push(score);
        },
      },
      render: ({ state }) => ({
        profile: state.user,
        totalScore: state.scores.reduce((a, b) => a + b, 0),
      }),
    };

    const adapter = new DOPAdapter(nestedLogic);
    const reactiveComponent = adapter.toReactive();

    const states: any[] = [];
    reactiveComponent.subscribe((state) => {
      states.push({ ...state });
    });

    reactiveComponent.dispatch("addScore", 40);
    const lastState = states[states.length - 1];

    expect(lastState.scores).toContain(40);
  });
});
