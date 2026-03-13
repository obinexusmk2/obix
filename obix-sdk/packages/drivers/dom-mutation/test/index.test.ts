import { describe, expect, it } from "vitest";
import { createDomMutationDriver } from "../src/index";

describe("dom-mutation", () => {
  it("generates deterministic patches and applies snapshot updates", async () => {
    const root = { setAttribute: () => undefined, textContent: "" } as unknown as Element;
    const driver = createDomMutationDriver({ rootElement: root });
    await driver.initialize();

    const patches = driver.diff({ b: 1, a: 1 }, { b: 2, a: 1, c: 3 });
    expect(patches.map((p) => p.path)).toEqual(["/b", "/c"]);

    await driver.updateRoot({ hello: "world" });
    expect(driver.getSnapshot()).toEqual({ hello: "world" });
    await driver.patch([{ type: "replace", path: "/hello", value: "obix" }]);
    expect(driver.getSnapshot()).toEqual({ hello: "obix" });
  });
});
