// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { createKeyboardNavigationController } from "../src/keyboard-navigation";
import { createFocusManager } from "../src/focus-management";

describe("keyboard-navigation", () => {
  let container: HTMLElement;

  afterEach(() => {
    container?.remove();
  });

  function setup() {
    container = document.createElement("div");
    container.innerHTML = `
      <div id="item1" tabindex="-1">Item 1</div>
      <div id="item2" tabindex="-1">Item 2</div>
      <div id="item3" tabindex="-1">Item 3</div>
    `;
    document.body.appendChild(container);
    const focusManager = createFocusManager();
    const keyNav = createKeyboardNavigationController();
    return { focusManager, keyNav };
  }

  it("creates a roving-tabindex navigation", () => {
    const { focusManager, keyNav } = setup();
    const items = Array.from(container.querySelectorAll("[id^='item']"));
    const nav = keyNav.createNavigation("test", {
      container,
      pattern: "roving-tabindex",
      orientation: "vertical",
      focusManager,
    });
    nav.setItems(items);
    nav.activate();

    // First item should be tabindex 0
    expect(items[0].getAttribute("tabindex")).toBe("0");
    expect(items[1].getAttribute("tabindex")).toBe("-1");
    expect(items[2].getAttribute("tabindex")).toBe("-1");

    nav.destroy();
    focusManager.destroy();
    keyNav.destroy();
  });

  it("moveTo changes current item", () => {
    const { focusManager, keyNav } = setup();
    const items = Array.from(container.querySelectorAll("[id^='item']"));
    const nav = keyNav.createNavigation("test2", {
      container,
      pattern: "roving-tabindex",
      orientation: "vertical",
      focusManager,
    });
    nav.setItems(items);
    nav.activate();
    nav.moveTo(2);
    expect(nav.getCurrentItem()).toBe(items[2]);
    expect(items[2].getAttribute("tabindex")).toBe("0");
    expect(items[0].getAttribute("tabindex")).toBe("-1");

    nav.destroy();
    focusManager.destroy();
    keyNav.destroy();
  });

  it("getNavigation retrieves existing navigation", () => {
    const { focusManager, keyNav } = setup();
    keyNav.createNavigation("findme", {
      container,
      pattern: "roving-tabindex",
      orientation: "vertical",
      focusManager,
    });
    expect(keyNav.getNavigation("findme")).toBeDefined();
    expect(keyNav.getNavigation("nonexistent")).toBeUndefined();
    keyNav.destroy();
    focusManager.destroy();
  });
});
