// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { createLiveRegionManager } from "../src/live-region-manager";
import { createScreenReaderBridge } from "../src/screen-reader-bridge";

describe("screen-reader-bridge", () => {
  let container: HTMLElement;

  afterEach(() => {
    container?.remove();
  });

  function setup() {
    container = document.createElement("div");
    document.body.appendChild(container);
    const lrm = createLiveRegionManager({ container });
    const bridge = createScreenReaderBridge({ liveRegionManager: lrm });
    return { lrm, bridge };
  }

  it("detect returns detection result", () => {
    const { bridge, lrm } = setup();
    const result = bridge.detect();
    expect(result).toHaveProperty("likely");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("signals");
    expect(Array.isArray(result.signals)).toBe(true);
    bridge.destroy();
    lrm.destroy();
  });

  it("announcePolite sends polite message", () => {
    const { bridge, lrm } = setup();
    bridge.announcePolite("Polite message");
    const region = container.querySelector("#live-region-__sr-polite__");
    expect(region?.textContent).toBe("Polite message");
    bridge.destroy();
    lrm.destroy();
  });

  it("announceAssertive sends assertive message", () => {
    const { bridge, lrm } = setup();
    bridge.announceAssertive("Urgent message");
    const region = container.querySelector("#live-region-__sr-assertive__");
    expect(region?.textContent).toBe("Urgent message");
    bridge.destroy();
    lrm.destroy();
  });

  it("announceRouteChange prefixes with 'Navigated to'", () => {
    const { bridge, lrm } = setup();
    bridge.announceRouteChange("Dashboard");
    const region = container.querySelector("#live-region-__sr-route__");
    expect(region?.textContent).toBe("Navigated to Dashboard");
    bridge.destroy();
    lrm.destroy();
  });

  it("optimization mode toggle", () => {
    const { bridge, lrm } = setup();
    expect(bridge.isOptimizationMode()).toBe(false);
    bridge.setOptimizationMode(true);
    expect(bridge.isOptimizationMode()).toBe(true);
    bridge.destroy();
    lrm.destroy();
  });
});
