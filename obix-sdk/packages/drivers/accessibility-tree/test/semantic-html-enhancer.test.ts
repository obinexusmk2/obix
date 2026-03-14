// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { createSemanticEnhancer } from "../src/semantic-html-enhancer";
import { createAriaStateManager } from "../src/state-properties-manager";

describe("semantic-html-enhancer", () => {
  let root: HTMLElement;

  afterEach(() => {
    root?.remove();
  });

  function setup(html: string) {
    root = document.createElement("div");
    root.innerHTML = html;
    document.body.appendChild(root);
    const stateManager = createAriaStateManager();
    const enhancer = createSemanticEnhancer({ rootElement: root, stateManager });
    return { stateManager, enhancer };
  }

  it("adds role=presentation to images without alt", () => {
    const { enhancer, stateManager } = setup('<img src="test.png">');
    const report = enhancer.scan();
    expect(report.enhanced).toBeGreaterThan(0);
    const img = root.querySelector("img")!;
    expect(img.getAttribute("role")).toBe("presentation");
    expect(img.getAttribute("alt")).toBe("");
    enhancer.destroy();
    stateManager.destroy();
  });

  it("adds aria-label to nav without one", () => {
    const { enhancer, stateManager } = setup("<nav><a href='/'>Home</a></nav>");
    enhancer.scan();
    const nav = root.querySelector("nav")!;
    expect(nav.getAttribute("aria-label")).toBe("Navigation");
    enhancer.destroy();
    stateManager.destroy();
  });

  it("adds aria-hidden to SVG without title", () => {
    const { enhancer, stateManager } = setup("<svg><circle r='5'/></svg>");
    enhancer.scan();
    const svg = root.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    enhancer.destroy();
    stateManager.destroy();
  });

  it("supports custom rules", () => {
    const { enhancer, stateManager } = setup('<div class="custom">Content</div>');
    enhancer.addRule({
      selector: ".custom",
      description: "Custom widget needs role",
      test: (el) => !el.getAttribute("role"),
      enhance: (el, sm) => sm.setState(el, "role", "status"),
    });
    enhancer.scan();
    expect(root.querySelector(".custom")!.getAttribute("role")).toBe("status");
    enhancer.destroy();
    stateManager.destroy();
  });

  it("returns builtin rules list", () => {
    const { enhancer, stateManager } = setup("");
    const rules = enhancer.getBuiltinRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every((r) => r.description && r.selector)).toBe(true);
    enhancer.destroy();
    stateManager.destroy();
  });
});
