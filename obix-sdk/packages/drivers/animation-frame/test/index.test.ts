import { describe, expect, it } from "vitest";
import { createAnimationFrameDriver } from "../src/index";

describe("animation-frame", () => {
  it("schedules and executes frames", async () => {
    const driver = createAnimationFrameDriver({ targetFPS: 30 });
    await driver.initialize();

    await new Promise<void>((resolve) => {
      driver.scheduleFrame(() => {
        resolve();
      });
    });

    expect(driver.getFrameCount()).toBeGreaterThan(0);
    driver.pause();
    driver.resume();
    await driver.destroy();
  });
});
