// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { createAccessibilityTreeMirror } from "../src/accessibility-tree-mirror";

describe("accessibility-tree-mirror", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  function setup() {
    root = document.createElement("div");
    root.innerHTML = `
      <nav aria-label="Main">
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
      <main>
        <h1>Title</h1>
        <button aria-expanded="false">Toggle</button>
      </main>
    `;
    document.body.appendChild(root);
    return createAccessibilityTreeMirror({ rootElement: root });
  }

  it("snapshot produces correct tree from DOM", () => {
    const mirror = setup();
    const tree = mirror.snapshot();
    expect(tree.role).toBe("generic"); // div has no implicit role
    expect(tree.children).toBeDefined();
    expect(tree.children!.length).toBe(2); // nav + main

    const nav = tree.children![0];
    expect(nav.role).toBe("navigation");
    expect(nav.label).toBe("Main");
    expect(nav.children!.length).toBe(2);
    expect(nav.children![0].role).toBe("link");

    const main = tree.children![1];
    expect(main.role).toBe("main");
    expect(main.children!.length).toBe(2);
    expect(main.children![0].role).toBe("heading");
    expect(main.children![1].role).toBe("button");
    expect(main.children![1].attributes?.["aria-expanded"]).toBe("false");

    mirror.destroy();
  });

  it("diff detects changes", () => {
    const mirror = setup();
    const snap1 = mirror.snapshot();

    // Modify the DOM
    const btn = root.querySelector("button")!;
    btn.setAttribute("aria-expanded", "true");

    const snap2 = mirror.snapshot();
    const diffs = mirror.diff(snap1, snap2);
    expect(diffs.length).toBeGreaterThan(0);
    const btnDiff = diffs.find((d) => d.newNode?.role === "button");
    expect(btnDiff).toBeDefined();
    expect(btnDiff!.type).toBe("changed");

    mirror.destroy();
  });

  it("serialize returns valid JSON", () => {
    const mirror = setup();
    const json = mirror.serialize();
    const parsed = JSON.parse(json);
    expect(parsed.role).toBe("generic");
    expect(parsed.children).toBeDefined();
    mirror.destroy();
  });
});
