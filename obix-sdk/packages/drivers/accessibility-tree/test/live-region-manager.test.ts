// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { createLiveRegionManager } from "../src/live-region-manager";

describe("live-region-manager", () => {
  let container: HTMLElement;

  afterEach(() => {
    container?.remove();
  });

  function setup() {
    container = document.createElement("div");
    document.body.appendChild(container);
    return createLiveRegionManager({ container, clearDelay: 100 });
  }

  it("creates a live region element in the container", () => {
    const mgr = setup();
    const handle = mgr.createRegion("test");
    expect(handle.id).toBe("test");
    expect(container.querySelector("#live-region-test")).toBeTruthy();
    expect(container.querySelector("#live-region-test")?.getAttribute("aria-live")).toBe("polite");
    mgr.destroy();
  });

  it("announces text by setting textContent", () => {
    const mgr = setup();
    const handle = mgr.createRegion("msg");
    handle.announce("Hello");
    expect(handle.getElement().textContent).toBe("Hello");
    mgr.destroy();
  });

  it("handles assertive level", () => {
    const mgr = setup();
    const handle = mgr.createRegion("urgent", { level: "assertive" });
    expect(handle.getElement().getAttribute("aria-live")).toBe("assertive");
    mgr.destroy();
  });

  it("destroys region and removes DOM element", () => {
    const mgr = setup();
    mgr.createRegion("remove-me");
    expect(container.querySelector("#live-region-remove-me")).toBeTruthy();
    mgr.destroyRegion("remove-me");
    expect(container.querySelector("#live-region-remove-me")).toBeNull();
    mgr.destroy();
  });

  it("global announce works without explicit region creation", () => {
    const mgr = setup();
    mgr.announceGlobal("Global message");
    const globalEl = container.querySelector("#live-region-__global__");
    expect(globalEl).toBeTruthy();
    expect(globalEl?.textContent).toBe("Global message");
    mgr.destroy();
  });

  it("tracks active regions", () => {
    const mgr = setup();
    mgr.createRegion("a");
    mgr.createRegion("b");
    expect(mgr.getActiveRegions()).toEqual(["a", "b"]);
    mgr.destroyRegion("a");
    expect(mgr.getActiveRegions()).toEqual(["b"]);
    mgr.destroy();
  });
});
