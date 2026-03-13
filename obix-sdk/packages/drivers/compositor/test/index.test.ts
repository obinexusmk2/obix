import { describe, expect, it } from "vitest";
import { createCompositorDriver } from "../src/index";

describe("compositor", () => {
  it("manages layers", async () => {
    const el = {} as Element;
    const driver = createCompositorDriver({ occlusionCulling: true });
    await driver.initialize();
    await driver.createLayer("a", el, 1);
    await driver.createLayer("b", el, 2);
    expect(driver.getLayers()).toHaveLength(2);
    expect(driver.isOccluded("a") || driver.isOccluded("b")).toBe(true);
  });
});
