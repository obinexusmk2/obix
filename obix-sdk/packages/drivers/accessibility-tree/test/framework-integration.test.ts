// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { createFrameworkIntegration } from "../src/framework-integration";
import { createAccessibilityTreeDriver } from "../src/index";
import { createLiveRegionManager } from "../src/live-region-manager";
import { createFocusManager } from "../src/focus-management";

describe("framework-integration", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  function setup() {
    root = document.createElement("div");
    document.body.appendChild(root);
    const driver = createAccessibilityTreeDriver({ rootElement: root });
    const lrm = createLiveRegionManager({ container: root });
    const fm = createFocusManager();
    const framework = createFrameworkIntegration({
      rootElement: root,
      driver,
      liveRegionManager: lrm,
      focusManager: fm,
    });
    return { driver, lrm, fm, framework };
  }

  it("detects default interaction mode as pointer", () => {
    const { framework, lrm, fm } = setup();
    expect(framework.detectInteractionMode()).toBe("pointer");
    framework.destroy();
    lrm.destroy();
    fm.destroy();
  });

  it("registers and retrieves pathways", () => {
    const { framework, lrm, fm } = setup();
    const nav = document.createElement("nav");
    root.appendChild(nav);

    framework.registerPathway({
      id: "main",
      label: "Main Navigation",
      landmarks: [{ role: "navigation", label: "Nav", element: nav }],
    });

    const pathways = framework.getPathways();
    expect(pathways.length).toBe(1);
    expect(pathways[0].id).toBe("main");
    expect(pathways[0].landmarks.length).toBe(1);

    framework.destroy();
    lrm.destroy();
    fm.destroy();
  });

  it("navigateToLandmark moves focus", () => {
    const { framework, lrm, fm } = setup();
    const btn = document.createElement("button");
    btn.textContent = "Target";
    root.appendChild(btn);

    framework.registerPathway({
      id: "path1",
      label: "Test Path",
      landmarks: [{ role: "button", label: "Target Button", element: btn }],
    });

    const result = framework.navigateToLandmark("path1", "Target Button");
    expect(result).toBe(true);
    expect(document.activeElement).toBe(btn);

    framework.destroy();
    lrm.destroy();
    fm.destroy();
  });

  it("returns false for non-existent pathway", () => {
    const { framework, lrm, fm } = setup();
    expect(framework.navigateToLandmark("nonexistent", "label")).toBe(false);
    framework.destroy();
    lrm.destroy();
    fm.destroy();
  });

  it("getAccessibilitySummary returns summary", () => {
    const { framework, lrm, fm } = setup();
    const summary = framework.getAccessibilitySummary();
    expect(summary).toHaveProperty("landmarks");
    expect(summary).toHaveProperty("liveRegions");
    expect(summary).toHaveProperty("interactionMode");
    expect(summary).toHaveProperty("pathways");
    expect(summary.interactionMode).toBe("pointer");
    framework.destroy();
    lrm.destroy();
    fm.destroy();
  });

  it("fires interaction mode change on keydown", () => {
    const { framework, lrm, fm } = setup();
    const handler = vi.fn();
    framework.onInteractionModeChange(handler);

    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(handler).toHaveBeenCalledWith("keyboard");

    framework.destroy();
    lrm.destroy();
    fm.destroy();
  });

  it("removes pathway", () => {
    const { framework, lrm, fm } = setup();
    framework.registerPathway({
      id: "temp",
      label: "Temporary",
      landmarks: [],
    });
    expect(framework.getPathways().length).toBe(1);
    framework.removePathway("temp");
    expect(framework.getPathways().length).toBe(0);

    framework.destroy();
    lrm.destroy();
    fm.destroy();
  });
});
