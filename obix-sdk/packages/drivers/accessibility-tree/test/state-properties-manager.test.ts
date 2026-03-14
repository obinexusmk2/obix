// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createAriaStateManager } from "../src/state-properties-manager";

describe("state-properties-manager", () => {
  it("setState/getState round-trip", () => {
    const mgr = createAriaStateManager();
    const el = document.createElement("div");
    mgr.setState(el, "aria-expanded", "true");
    expect(mgr.getState(el, "aria-expanded")).toBe("true");
    expect(el.getAttribute("aria-expanded")).toBe("true");
    mgr.destroy();
  });

  it("removes attribute when value is undefined", () => {
    const mgr = createAriaStateManager();
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    mgr.setState(el, "aria-hidden", "true");
    mgr.removeState(el, "aria-hidden");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    expect(mgr.getState(el, "aria-hidden")).toBeUndefined();
    mgr.destroy();
  });

  it("removes attribute when value is false", () => {
    const mgr = createAriaStateManager();
    const el = document.createElement("div");
    mgr.setState(el, "aria-selected", false);
    expect(el.hasAttribute("aria-selected")).toBe(false);
    mgr.destroy();
  });

  it("sets attribute to 'true' when value is boolean true", () => {
    const mgr = createAriaStateManager();
    const el = document.createElement("div");
    mgr.setState(el, "aria-checked", true);
    expect(el.getAttribute("aria-checked")).toBe("true");
    mgr.destroy();
  });

  it("getAllStates returns all states for element", () => {
    const mgr = createAriaStateManager();
    const el = document.createElement("div");
    mgr.setState(el, "role", "button");
    mgr.setState(el, "aria-pressed", "false");
    const states = mgr.getAllStates(el);
    expect(states["role"]).toBe("button");
    expect(states["aria-pressed"]).toBe("false");
    mgr.destroy();
  });

  it("fires state change handlers", () => {
    const mgr = createAriaStateManager();
    const el = document.createElement("div");
    const handler = vi.fn();
    const unsub = mgr.onStateChange(handler);
    mgr.setState(el, "aria-expanded", "true");
    expect(handler).toHaveBeenCalledWith(el, "aria-expanded", "true");
    unsub();
    mgr.setState(el, "aria-expanded", "false");
    expect(handler).toHaveBeenCalledTimes(1);
    mgr.destroy();
  });

  it("batch mode defers DOM writes", async () => {
    const mgr = createAriaStateManager({ batchUpdates: true });
    const el = document.createElement("div");
    mgr.setState(el, "aria-label", "test");
    // Not yet applied to DOM
    expect(el.getAttribute("aria-label")).toBeNull();
    // Wait for microtask
    await Promise.resolve();
    expect(el.getAttribute("aria-label")).toBe("test");
    mgr.destroy();
  });
});
