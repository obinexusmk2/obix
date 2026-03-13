import { describe, expect, it } from "vitest";
import { createMediaQueryDriver } from "../src/index";

describe("media-query", () => {
  it("provides safe fallbacks without browser APIs", async () => {
    const driver = createMediaQueryDriver({
      breakpoints: [{ name: "desktop", minWidth: 900 }],
      safeAreaHandling: true,
    });
    await driver.initialize();
    expect(driver.getViewportSize().width).toBeGreaterThan(0);
    expect(driver.getSafeAreaInsets()).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });
});
