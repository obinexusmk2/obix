import { describe, expect, it } from "vitest";
import { createStoragePersistenceDriver } from "../src/index";

describe("storage-persistence", () => {
  it("stores, retrieves and expires values", async () => {
    const driver = createStoragePersistenceDriver({ namespace: "t" });
    await driver.initialize();
    await driver.set("k", "v", 1);
    expect(await driver.get("k")).toBe("v");
    await new Promise((r) => setTimeout(r, 2));
    await driver.cleanup();
    expect(await driver.get("k")).toBeNull();
  });
});
