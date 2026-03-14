// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { createWidgetComplianceEngine } from "../src/aria-widget-compliance";
import { createAriaStateManager } from "../src/state-properties-manager";
import { createFocusManager } from "../src/focus-management";
import { createKeyboardNavigationController } from "../src/keyboard-navigation";

describe("aria-widget-compliance", () => {
  let container: HTMLElement;

  afterEach(() => {
    container?.remove();
  });

  function setup() {
    const stateManager = createAriaStateManager();
    const focusManager = createFocusManager();
    const keyboardNav = createKeyboardNavigationController();
    const engine = createWidgetComplianceEngine({ stateManager, focusManager, keyboardNav });
    return { stateManager, focusManager, keyboardNav, engine };
  }

  it("creates and activates accordion widget", () => {
    container = document.createElement("div");
    container.innerHTML = `
      <div data-accordion-header id="h1">Section 1</div>
      <div data-accordion-panel id="p1">Content 1</div>
      <div data-accordion-header id="h2">Section 2</div>
      <div data-accordion-panel id="p2">Content 2</div>
    `;
    document.body.appendChild(container);

    const { engine, stateManager, focusManager, keyboardNav } = setup();
    const widget = engine.createWidget("acc", { container, pattern: "accordion" });
    widget.activate();

    const headers = container.querySelectorAll("[data-accordion-header]");
    expect(headers[0].getAttribute("role")).toBe("button");
    expect(headers[0].getAttribute("aria-expanded")).toBe("false");
    expect(headers[0].getAttribute("aria-controls")).toBe("p1");

    const panels = container.querySelectorAll("[data-accordion-panel]");
    expect(panels[0].getAttribute("role")).toBe("region");
    expect(panels[0].getAttribute("aria-labelledby")).toBe("h1");

    widget.destroy();
    engine.destroy();
    stateManager.destroy();
    focusManager.destroy();
    keyboardNav.destroy();
  });

  it("validates slider widget correctly", () => {
    container = document.createElement("div");
    container.innerHTML = `<div data-slider data-value="50" data-min="0" data-max="100">Slider</div>`;
    document.body.appendChild(container);

    const { engine, stateManager, focusManager, keyboardNav } = setup();
    const widget = engine.createWidget("slider", { container, pattern: "slider" });
    widget.activate();

    const validation = widget.validate();
    expect(validation.valid).toBe(true);

    widget.destroy();
    engine.destroy();
    stateManager.destroy();
    focusManager.destroy();
    keyboardNav.destroy();
  });

  it("validates tabs widget", () => {
    container = document.createElement("div");
    container.innerHTML = `
      <div data-tablist>
        <div data-tab id="t1">Tab 1</div>
        <div data-tab id="t2">Tab 2</div>
      </div>
      <div data-tabpanel id="tp1">Panel 1</div>
      <div data-tabpanel id="tp2">Panel 2</div>
    `;
    document.body.appendChild(container);

    const { engine, stateManager, focusManager, keyboardNav } = setup();
    const widget = engine.createWidget("tabs", { container, pattern: "tabs" });
    widget.activate();

    const tablist = container.querySelector("[data-tablist]")!;
    expect(tablist.getAttribute("role")).toBe("tablist");

    const tabs = container.querySelectorAll("[data-tab]");
    expect(tabs[0].getAttribute("role")).toBe("tab");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");

    const validation = widget.validate();
    expect(validation.valid).toBe(true);

    widget.destroy();
    engine.destroy();
    stateManager.destroy();
    focusManager.destroy();
    keyboardNav.destroy();
  });

  it("getSupportedPatterns returns all patterns", () => {
    const { engine, stateManager, focusManager, keyboardNav } = setup();
    const patterns = engine.getSupportedPatterns();
    expect(patterns).toContain("accordion");
    expect(patterns).toContain("tabs");
    expect(patterns).toContain("slider");
    expect(patterns).toContain("menu-bar");
    expect(patterns).toContain("dialog");
    engine.destroy();
    stateManager.destroy();
    focusManager.destroy();
    keyboardNav.destroy();
  });

  it("validateAll checks all registered widgets", () => {
    container = document.createElement("div");
    document.body.appendChild(container);

    const { engine, stateManager, focusManager, keyboardNav } = setup();
    engine.createWidget("empty-dialog", { container, pattern: "dialog" });
    const results = engine.validateAll();
    expect(results.size).toBe(1);
    // Dialog without aria-label should have errors
    const dialogResult = results.get("empty-dialog")!;
    expect(dialogResult.errors.length).toBeGreaterThan(0);

    engine.destroy();
    stateManager.destroy();
    focusManager.destroy();
    keyboardNav.destroy();
  });
});
