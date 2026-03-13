/**
 * Test suite for OBIX Runtime Engine
 * Tests component lifecycle, state management, halting, and policies
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ObixRuntime,
  ComponentDefinition,
  LifecycleHook,
  Policy
} from "../src/index.js";

describe("ObixRuntime", () => {
  let runtime: ObixRuntime;

  // Simple test component definition
  const counterComponentDef: ComponentDefinition<{ count: number }> = {
    name: "Counter",
    state: { count: 0 },
    actions: {
      increment: () => ({ count: 1 }),
      decrement: () => ({ count: -1 }),
      set: (value: number) => ({ count: value })
    },
    render: (state) => `<div>Count: ${state.count}</div>`
  };

  const userComponentDef: ComponentDefinition<{
    name: string;
    email: string;
    active: boolean;
  }> = {
    name: "User",
    state: { name: "", email: "", active: false },
    actions: {
      setName: (name: string) => ({ name }),
      setEmail: (email: string) => ({ email }),
      toggleActive: () => ({ active: true })
    },
    render: (state) => `<div>${state.name} (${state.email})</div>`
  };

  beforeEach(() => {
    runtime = new ObixRuntime();
  });

  describe("Component Registration", () => {
    it("should register a component definition", () => {
      runtime.register(counterComponentDef);
      const registered = runtime.getRegistered();
      expect(registered).toHaveLength(1);
      expect(registered[0].name).toBe("Counter");
    });

    it("should reject definition without a name", () => {
      expect(() => {
        runtime.register({
          name: "",
          state: {},
          actions: {},
          render: () => null
        });
      }).toThrow("Component definition must have a name");
    });

    it("should allow multiple component registrations", () => {
      runtime.register(counterComponentDef);
      runtime.register(userComponentDef);
      expect(runtime.getRegistered()).toHaveLength(2);
    });
  });

  describe("Component Creation", () => {
    beforeEach(() => {
      runtime.register(counterComponentDef);
      runtime.register(userComponentDef);
    });

    it("should create an instance from a registered definition", () => {
      const instance = runtime.create("Counter");
      expect(instance).toBeDefined();
      expect(instance.definition.name).toBe("Counter");
      expect(instance.currentState.count).toBe(0);
      expect(instance.halted).toBe(false);
      expect(instance.revision).toBe(0);
    });

    it("should throw on unregistered component", () => {
      expect(() => runtime.create("NonExistent")).toThrow(
        "Component 'NonExistent' not registered"
      );
    });

    it("should merge initial state with definition state", () => {
      const instance = runtime.create("User", { name: "Alice" });
      expect(instance.currentState.name).toBe("Alice");
      expect(instance.currentState.email).toBe("");
      expect(instance.currentState.active).toBe(false);
    });

    it("should generate unique instance IDs", () => {
      const inst1 = runtime.create("Counter");
      const inst2 = runtime.create("Counter");
      expect(inst1.id).not.toBe(inst2.id);
      expect(inst1.id).toMatch(/^Counter-\d+$/);
    });
  });

  describe("State Updates via Actions", () => {
    let instanceId: string;

    beforeEach(() => {
      runtime.register(counterComponentDef);
      const instance = runtime.create("Counter");
      instanceId = instance.id;
    });

    it("should apply an action and update state", () => {
      const updated = runtime.update(instanceId, "increment");
      expect(updated).toBeDefined();
      expect(updated!.currentState.count).toBe(1);
      expect(updated!.revision).toBe(1);
    });

    it("should increment revision on each update", () => {
      let instance = runtime.update(instanceId, "increment")!;
      expect(instance.revision).toBe(1);

      instance = runtime.update(instanceId, "increment")!;
      expect(instance.revision).toBe(2);

      instance = runtime.update(instanceId, "increment")!;
      expect(instance.revision).toBe(3);
    });

    it("should merge action delta with current state", () => {
      runtime.register(userComponentDef);
      const instance = runtime.create("User", { name: "Bob" });
      runtime.update(instance.id, "setEmail", "bob@example.com");

      const updated = runtime.getInstance(instance.id)!;
      expect(updated.currentState.name).toBe("Bob");
      expect(updated.currentState.email).toBe("bob@example.com");
      expect(updated.currentState.active).toBe(false);
    });

    it("should throw on non-existent action", () => {
      expect(() => runtime.update(instanceId, "nonExistent")).toThrow(
        "Action 'nonExistent' not found"
      );
    });

    it("should throw on non-existent instance", () => {
      expect(() => runtime.update("fake-id", "increment")).toThrow(
        "Instance 'fake-id' not found"
      );
    });

    it("should skip updates on halted instance", () => {
      runtime.halt(instanceId, "Test halt");
      const before = runtime.getInstance(instanceId)!;
      const attempted = runtime.update(instanceId, "increment");

      expect(attempted).toBe(before);
      expect(attempted!.currentState.count).toBe(0);
    });
  });

  describe("State Halting", () => {
    it("should halt instance when state stabilizes", () => {
      const def: ComponentDefinition<{ value: number }> = {
        name: "Stable",
        state: { value: 0 },
        actions: {
          setStable: () => ({ value: 42 })
        },
        render: (s) => s.value.toString()
      };

      // Create runtime with low stability threshold
      const haltRuntime = new ObixRuntime({
        stabilityThreshold: 2
      });
      haltRuntime.register(def);
      const instance = haltRuntime.create("Stable");

      // Apply same action multiple times
      haltRuntime.update(instance.id, "setStable");
      haltRuntime.update(instance.id, "setStable");

      // Should be halted after stability threshold
      const halted = haltRuntime.getInstance(instance.id)!;
      expect(halted.halted).toBe(true);
      expect(halted.haltReason).toContain("stabilized");
    });

    it("should manually halt an instance", () => {
      runtime.register(counterComponentDef);
      const instance = runtime.create("Counter");

      runtime.halt(instance.id, "Manual stop");

      const halted = runtime.getInstance(instance.id)!;
      expect(halted.halted).toBe(true);
      expect(halted.haltReason).toBe("Manual stop");
    });

    it("should resume a halted instance", () => {
      runtime.register(counterComponentDef);
      const instance = runtime.create("Counter");

      runtime.halt(instance.id);
      let halted = runtime.getInstance(instance.id)!;
      expect(halted.halted).toBe(true);

      runtime.resume(instance.id);
      halted = runtime.getInstance(instance.id)!;
      expect(halted.halted).toBe(false);
      expect(halted.haltReason).toBeUndefined();
    });

    it("should allow updates after resume", () => {
      runtime.register(counterComponentDef);
      const instance = runtime.create("Counter");

      runtime.halt(instance.id);
      runtime.resume(instance.id);

      const updated = runtime.update(instance.id, "increment")!;
      expect(updated.currentState.count).toBe(1);
    });
  });

  describe("Policy Enforcement", () => {
    it("should enforce built-in policies on instance creation", () => {
      // Invalid component: no render function
      const invalidDef: ComponentDefinition<{ x: number }> = {
        name: "Invalid",
        state: { x: 0 },
        actions: {},
        render: undefined as any
      };

      expect(() => {
        runtime.register(invalidDef);
        runtime.create("Invalid");
      }).not.toThrow();

      // But instance should have violations
      const instance = runtime.create("Invalid");
      expect(instance.policyViolations).toBeDefined();
      expect(instance.policyViolations!.length).toBeGreaterThan(0);
    });

    it("should halt instance on policy violation if configured", () => {
      const invalidDef: ComponentDefinition<{ x: number }> = {
        name: "PolicyTest",
        state: { x: 0 },
        actions: {},
        render: undefined as any
      };

      const strictRuntime = new ObixRuntime({
        haltOnPolicyViolation: true
      });
      strictRuntime.register(invalidDef);
      const instance = strictRuntime.create("PolicyTest");

      expect(instance.halted).toBe(true);
      expect(instance.haltReason).toContain("Policy");
    });

    it("should allow custom policies", () => {
      const customPolicy: Policy<{ count: number }> = {
        name: "MaxCount",
        enforce: (instance) => {
          const count = instance.currentState.count;
          return {
            passed: count <= 100,
            violations:
              count > 100
                ? [{ policy: "MaxCount", message: "Count exceeds 100" }]
                : []
          };
        }
      };

      const policyRuntime = new ObixRuntime({}, [customPolicy]);
      policyRuntime.register(counterComponentDef);

      const instance = policyRuntime.create("Counter");
      policyRuntime.update(instance.id, "set", 150);

      const updated = policyRuntime.getInstance(instance.id)!;
      expect(updated.policyViolations).toBeDefined();
      const violations = updated.policyViolations!;
      expect(violations.some((v) => v.policy === "MaxCount")).toBe(true);
    });
  });

  describe("Lifecycle Hooks", () => {
    it("should fire CREATED hook on instance creation", () => {
      runtime.register(counterComponentDef);

      let hookFired = false;
      runtime.onLifecycle((event) => {
        if (event.hook === LifecycleHook.CREATED) {
          hookFired = true;
          expect(event.instanceId).toBeDefined();
          expect(event.instance).toBeDefined();
          expect(event.timestamp).toBeGreaterThan(0);
        }
      });

      runtime.create("Counter");
      expect(hookFired).toBe(true);
    });

    it("should fire UPDATED hook on state update", () => {
      runtime.register(counterComponentDef);
      const instance = runtime.create("Counter");

      let hookFired = false;
      runtime.onLifecycle((event) => {
        if (event.hook === LifecycleHook.UPDATED) {
          hookFired = true;
          expect(event.instance!.revision).toBeGreaterThan(0);
        }
      });

      runtime.update(instance.id, "increment");
      expect(hookFired).toBe(true);
    });

    it("should fire HALTED hook when instance is halted", () => {
      runtime.register(counterComponentDef);
      const instance = runtime.create("Counter");

      let hookFired = false;
      runtime.onLifecycle((event) => {
        if (event.hook === LifecycleHook.HALTED) {
          hookFired = true;
          expect(event.instance!.halted).toBe(true);
        }
      });

      runtime.halt(instance.id);
      expect(hookFired).toBe(true);
    });

    it("should fire DESTROYED hook on instance destruction", () => {
      runtime.register(counterComponentDef);
      const instance = runtime.create("Counter");

      let hookFired = false;
      runtime.onLifecycle((event) => {
        if (event.hook === LifecycleHook.DESTROYED) {
          hookFired = true;
          expect(event.instanceId).toBe(instance.id);
        }
      });

      runtime.destroy(instance.id);
      expect(hookFired).toBe(true);
    });

    it("should not error if lifecycle handler throws", () => {
      runtime.register(counterComponentDef);

      runtime.onLifecycle(() => {
        throw new Error("Test error");
      });

      // Should not throw
      expect(() => {
        runtime.create("Counter");
      }).not.toThrow();
    });
  });

  describe("Instance Management", () => {
    beforeEach(() => {
      runtime.register(counterComponentDef);
    });

    it("should retrieve instance by ID", () => {
      const created = runtime.create("Counter");
      const retrieved = runtime.getInstance(created.id);
      expect(retrieved).toBe(created);
    });

    it("should return null for non-existent instance", () => {
      const retrieved = runtime.getInstance("fake-id");
      expect(retrieved).toBeNull();
    });

    it("should get all active instances", () => {
      const inst1 = runtime.create("Counter");
      const inst2 = runtime.create("Counter");

      const all = runtime.getInstances();
      expect(all).toHaveLength(2);
      expect(all.map((i) => i.id)).toContain(inst1.id);
      expect(all.map((i) => i.id)).toContain(inst2.id);
    });

    it("should remove destroyed instance from active list", () => {
      const instance = runtime.create("Counter");
      expect(runtime.getInstances()).toHaveLength(1);

      runtime.destroy(instance.id);
      expect(runtime.getInstances()).toHaveLength(0);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete lifecycle: create -> update -> halt -> resume -> destroy", () => {
      runtime.register(counterComponentDef);

      const hookSequence: LifecycleHook[] = [];
      runtime.onLifecycle((event) => {
        hookSequence.push(event.hook);
      });

      const instance = runtime.create("Counter");
      expect(instance.halted).toBe(false);

      runtime.update(instance.id, "increment");
      const updated = runtime.getInstance(instance.id)!;
      expect(updated.currentState.count).toBe(1);

      runtime.halt(instance.id);
      expect(runtime.getInstance(instance.id)!.halted).toBe(true);

      runtime.resume(instance.id);
      expect(runtime.getInstance(instance.id)!.halted).toBe(false);

      runtime.destroy(instance.id);
      expect(runtime.getInstance(instance.id)).toBeNull();

      expect(hookSequence).toContain(LifecycleHook.CREATED);
      expect(hookSequence).toContain(LifecycleHook.UPDATED);
      expect(hookSequence).toContain(LifecycleHook.HALTED);
    });

    it("should track state changes across multiple instances", () => {
      runtime.register(counterComponentDef);

      const inst1 = runtime.create("Counter");
      const inst2 = runtime.create("Counter");

      runtime.update(inst1.id, "set", 100);
      runtime.update(inst2.id, "set", 200);

      expect(runtime.getInstance(inst1.id)!.currentState.count).toBe(100);
      expect(runtime.getInstance(inst2.id)!.currentState.count).toBe(200);
    });
  });
});
