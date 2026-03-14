// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { createFocusManager } from "../src/focus-management";

describe("focus-management", () => {
  let container: HTMLElement;

  afterEach(() => {
    container?.remove();
  });

  function setup() {
    container = document.createElement("div");
    container.innerHTML = `
      <button id="btn1">First</button>
      <button id="btn2">Second</button>
      <button id="btn3">Third</button>
    `;
    document.body.appendChild(container);
    return createFocusManager();
  }

  it("getFocusableElements returns focusable children", () => {
    const mgr = setup();
    const elements = mgr.getFocusableElements(container);
    expect(elements.length).toBe(3);
    mgr.destroy();
  });

  it("moveFocus sets focus on target element", () => {
    const mgr = setup();
    const btn = container.querySelector("#btn2") as HTMLElement;
    const result = mgr.moveFocus(btn);
    expect(result).toBe(true);
    expect(document.activeElement).toBe(btn);
    mgr.destroy();
  });

  it("moveFocus accepts CSS selector", () => {
    const mgr = setup();
    mgr.moveFocus("#btn3");
    expect(document.activeElement?.id).toBe("btn3");
    mgr.destroy();
  });

  it("save and restore focus", () => {
    const mgr = setup();
    const btn1 = container.querySelector("#btn1") as HTMLElement;
    btn1.focus();
    mgr.saveFocus("test");
    const btn2 = container.querySelector("#btn2") as HTMLElement;
    btn2.focus();
    expect(document.activeElement).toBe(btn2);
    mgr.restoreFocus("test");
    expect(document.activeElement).toBe(btn1);
    mgr.destroy();
  });

  it("creates focus trap", () => {
    const mgr = setup();
    const trap = mgr.createFocusTrap({ container });
    expect(trap.isActive()).toBe(false);
    trap.activate();
    expect(trap.isActive()).toBe(true);
    // Focus should be on first focusable element
    expect(document.activeElement?.id).toBe("btn1");
    trap.deactivate();
    expect(trap.isActive()).toBe(false);
    mgr.destroy();
  });
});
