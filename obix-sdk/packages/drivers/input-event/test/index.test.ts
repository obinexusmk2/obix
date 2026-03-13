import { describe, expect, it } from "vitest";
import { createInputEventDriver } from "../src/index";

describe("input-event", () => {
  it("registers and removes handlers safely", async () => {
    const root = {} as Element;
    const driver = createInputEventDriver({ rootElement: root });
    await driver.initialize();
    const handler = () => undefined;
    driver.on("pointerdown", handler);
    driver.off("pointerdown", handler);
    expect(driver.getLastPointerPosition()).toBeNull();
  });
});
