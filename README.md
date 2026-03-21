# OBIX — Heart/Soul UI/UX SDK

> *Obi* (Igbo) — **Heart. Soul. The living centre.**

**OBIX** is a data-oriented, accessibility-first UI/UX Software Development Kit
built on the principle that the interface is the heart of any software system.
Named from the Igbo word *Obi*, meaning Heart and Soul, OBIX treats human
interaction not as a layer on top of software, but as the core from which
everything else is structured.

OBIX is the UI/UX surface layer of the [OBINexus Computing](https://github.com/obinexusmk2)
framework, published to npm under the `@obinexusltd` organisation.

---

## Install

```bash
# Core runtime
npm install @obinexusltd/obix-core

# UI primitives
npm install @obinexusltd/obix-components

# Full SDK (install what you need)
npm install @obinexusltd/obix-state
npm install @obinexusltd/obix-router
npm install @obinexusltd/obix-forms
npm install @obinexusltd/obix-accessibility
npm install @obinexusltd/obix-telemetry
```

---

## What Is OBIX?

OBIX is a **monorepo SDK** structured across three layers:

### Layer 1 — SDK Core
The application-facing layer. Start here.

| Package | Purpose |
|---|---|
| `obix-core` | Component lifecycle, state halting, data-oriented runtime |
| `obix-components` | Accessible UI primitives with FUD-mitigation policies |
| `obix-state` | Automata-based state machine minimisation |
| `obix-router` | SPA navigation, scroll restoration, deep linking |
| `obix-forms` | Validation, autocomplete, progressive enhancement |
| `obix-accessibility` | WCAG 2.2 enforcement, ARIA automation, focus management |
| `obix-telemetry` | State tracking, policy decorators, QA matrix |
| `obix-adapter` | Data-oriented paradigm translation layer |
| `obix-cli` | Build tooling, schema validation, SemVerX management |

### Layer 2 — Drivers
Platform interface layer. Abstracts browser APIs into stable, testable drivers.

| Package | Purpose |
|---|---|
| `obix-driver-accessibility-tree` | ARIA/live region management, screen reader bridge |
| `obix-driver-animation-frame` | requestAnimationFrame scheduling and timeline orchestration |
| `obix-driver-compositor` | Layer management, z-index optimisation, occlusion culling |
| `obix-driver-dom-mutation` | Deterministic patch generation and snapshot updates |
| `obix-driver-font-layout` | Font metrics and layout measurement |
| `obix-driver-gpu-acceleration` | WebGL/WebGPU canvas rendering and shader management |
| `obix-driver-input-event` | Unified touch/mouse/keyboard/pointer normalisation |
| `obix-driver-media-query` | Responsive breakpoint detection, safe-area handling |
| `obix-driver-network-stream` | WebSocket/SSE for telemetry and real-time state sync |
| `obix-driver-storage-persistence` | LocalStorage/IndexedDB wrapper for state caching |

### Layer 3 — Bindings
Cross-language bridge layer. Connect OBIX to any target runtime.

| Package | Target |
|---|---|
| `obix-binding-typescript` | Primary web runtime, Node.js & browser |
| `obix-binding-go` | Backend microservices, concurrent state management |
| `obix-binding-python` | ML/AI integration, data science workflows |
| `obix-binding-rust` | Memory-safe systems integration, WebAssembly |
| `obix-binding-cpp` | Legacy systems, embedded targets |
| `obix-binding-swift` | iOS/macOS native rendering bridge |
| `obix-binding-java-kotlin` | Android native, enterprise backend |
| `obix-binding-csharp` | .NET/Unity integration |
| `obix-binding-zig` | Systems programming, compile-time optimisation |
| `obix-binding-lua` | Game engine integration (Love2D, Roblox), scripting |

---

## Design Principles

**Data-Oriented Architecture**
Components are plain data structures. State is explicit, not hidden in closures
or reactive proxies. Every component instance is inspectable, serialisable, and
deterministic.

**Accessibility-First**
WCAG 2.2 is a constraint, not a feature. Touch targets, ARIA labels, focus
management, and reduced-motion support are enforced at the policy layer —
not left to the developer to remember.

**FUD Mitigation**
OBIX identifies and mitigates common UI failure modes:
- Autocomplete Attribute Neglect
- Form Validation Timing errors
- Cumulative Layout Shift (CLS) from unsized containers
- Focus trap failures in modal dialogs
- Touch target violations

**State Halting**
Instances that reach a stable state are automatically halted — preventing
unnecessary re-renders and providing a clear signal that a component has
reached its terminal condition. Halted instances can be explicitly resumed.

**Neurodivergent-First**
Sensory considerations — reduced motion, high contrast, predictable interaction
patterns, clear focus indicators — are built into the architecture, not added
as accessibility afterthoughts.

---

## Quick Start

```typescript
import { ObixRuntime } from '@obinexusltd/obix-core';

const runtime = new ObixRuntime();

// Register a component definition
runtime.register({
  name: 'Counter',
  state: { count: 0 },
  actions: {
    increment: (state) => ({ count: state.count + 1 }),
    decrement: (state) => ({ count: state.count - 1 }),
    reset:     ()      => ({ count: 0 }),
  }
});

// Create an instance
const id = runtime.create('Counter');

// Dispatch actions
runtime.dispatch(id, 'increment');
runtime.dispatch(id, 'increment');

// Read state
const instance = runtime.getInstance(id);
console.log(instance.state.count); // 2
```

---

## Build & Test

```bash
git clone https://github.com/obinexusmk2/obix
cd obix
npm install
npm run build   # compiles all 29 packages
npm run test    # runs full test suite
```

**Verified 13 March 2026:**
- Build: PASS — all 29 packages via `tsc`, zero errors
- `obix-core`: 31/31 tests
- `obix-components`: 51/51 tests (incl. FUD compliance, ARIA, touch targets)
- `obix-state`: 36/36 tests
- All other packages: passing

---

## Provenance

See [PROVENANCE.md](./PROVENANCE.md) for the full development record,
package registry, build verification, and authorship declaration.

**Dependency chain:**
```
libpolycall-v1  (github.com/obinexusmk2/libpolycall-v1)
     ↓  protocol and binding foundation
obix            (github.com/obinexusmk2/obix)
     ↓  compiled and published as
@obinexusltd/*  (npmjs.com/org/obinexusltd)
```

---

## Author

**Nnamdi Okpalan** — Founder, OBINexus Computing
`okpalan@protonmail.com`
GitHub: [@obinexusmk2](https://github.com/obinexusmk2)
npm: [@obinexusltd](https://www.npmjs.com/org/obinexusltd)

---

## License

MIT © OBINexus Computing
