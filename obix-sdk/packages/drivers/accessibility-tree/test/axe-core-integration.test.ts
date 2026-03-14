// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createAxeIntegration } from "../src/axe-core-integration";

describe("axe-core-integration", () => {
  it("isAvailable returns false when axe-core is not installed", () => {
    const root = document.createElement("div");
    const integration = createAxeIntegration({ rootElement: root });
    // axe-core is not installed in this test environment
    expect(integration.isAvailable()).toBe(false);
    integration.destroy();
  });

  it("run throws when axe-core is not available", async () => {
    const root = document.createElement("div");
    const integration = createAxeIntegration({ rootElement: root });
    await expect(integration.run()).rejects.toThrow("axe-core is not available");
    integration.destroy();
  });

  it("exports correct interface shape", () => {
    const root = document.createElement("div");
    const integration = createAxeIntegration({ rootElement: root });
    expect(typeof integration.run).toBe("function");
    expect(typeof integration.runOnNode).toBe("function");
    expect(typeof integration.isAvailable).toBe("function");
    expect(typeof integration.destroy).toBe("function");
    integration.destroy();
  });
});
