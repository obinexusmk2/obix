// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createAccessibilityTreeDriver } from "../src/index";

describe("accessibility-tree", () => {
  it("stores accessibility node data", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const element = document.createElement("button");
    root.appendChild(element);

    const driver = createAccessibilityTreeDriver({ rootElement: root });
    await driver.initialize();
    await driver.registerLiveRegion(element);
    driver.updateAccessibilityNode(element, { role: "button", label: "Run" });
    driver.announce("updated");

    // Verify the tree contains our node
    const tree = driver.getAccessibilityTree();
    expect(tree.role).toBeDefined();

    // Verify element got ARIA attributes
    expect(element.getAttribute("role")).toBe("button");
    expect(element.getAttribute("aria-label")).toBe("Run");

    await driver.destroy();
    document.body.removeChild(root);
  });

  it("sub-features are available after initialize", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);

    const driver = createAccessibilityTreeDriver({ rootElement: root });

    // Before init, sub-features are undefined
    expect(driver.liveRegions).toBeUndefined();
    expect(driver.stateManager).toBeUndefined();

    await driver.initialize();

    // After init, all sub-features are available
    expect(driver.liveRegions).toBeDefined();
    expect(driver.stateManager).toBeDefined();
    expect(driver.focusManager).toBeDefined();
    expect(driver.screenReaderBridge).toBeDefined();
    expect(driver.keyboardNav).toBeDefined();
    expect(driver.treeMirror).toBeDefined();
    expect(driver.semanticEnhancer).toBeDefined();
    expect(driver.widgetCompliance).toBeDefined();
    expect(driver.axeIntegration).toBeDefined();
    expect(driver.framework).toBeDefined();

    await driver.destroy();
    document.body.removeChild(root);
  });

  it("announce sends messages via screen reader bridge", async () => {
    const root = document.createElement("div");
    document.body.appendChild(root);

    const driver = createAccessibilityTreeDriver({ rootElement: root });
    await driver.initialize();

    driver.announce("Hello world", "polite");
    driver.announce("Urgent!", "assertive");

    // Verify live regions were created in the DOM
    const liveRegions = root.querySelectorAll("[aria-live]");
    expect(liveRegions.length).toBeGreaterThan(0);

    await driver.destroy();
    document.body.removeChild(root);
  });
});
