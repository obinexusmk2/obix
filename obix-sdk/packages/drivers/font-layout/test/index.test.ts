import { describe, expect, it } from "vitest";
import { createFontLayoutDriver } from "../src/index";

describe("font-layout", () => {
  it("loads fonts and measures text", async () => {
    const driver = createFontLayoutDriver({ measureCache: true });
    await driver.initialize();
    await driver.loadFont({ family: "Inter", size: 16 }, "");
    expect(driver.isFontLoaded({ family: "Inter", size: 16 })).toBe(true);
    expect(driver.measureText("abc", { family: "Inter", size: 10 }).width).toBeGreaterThan(0);
  });
});
