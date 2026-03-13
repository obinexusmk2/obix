import { describe, expect, it } from "vitest";
import { createAccessibilityTreeDriver } from "../src/index";

describe("accessibility-tree", () => {
  it("stores accessibility node data", async () => {
    const root = { setAttribute: () => undefined } as unknown as Element;
    const element = { setAttribute: () => undefined } as unknown as Element;
    const driver = createAccessibilityTreeDriver({ rootElement: root });
    await driver.initialize();
    await driver.registerLiveRegion(element);
    driver.updateAccessibilityNode(element, { role: "button", label: "Run" });
    driver.announce("updated");
    expect(driver.getAccessibilityTree().children?.[0].role).toBe("button");
  });
});
