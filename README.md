# OBIX — Heart/Soul UI/UX SDK

> *OBI* means **heart** or **soul** in Igbo. OBIX is a data-oriented UI/UX library with framework-like features — it looks like React, it feels like React, but it is not React.

**Author:** Nnamdi Okpala — OBINexus Computing
**Contact:** okpalan@protonmail.com
**License:** MIT
**Status:** Pre-release · Monoglot schema active · Polyglot/Hybrid in development

---

## Philosophy

OBIX is built around one core insight: **fear, uncertainty, and doubt (FUD) are the root cause of most UI/UX failures.** Layout shifts, inaccessible controls, broken navigation, invisible errors — these are not bugs, they are expressions of a system that was not designed with the user's trust in mind.

OBIX addresses FUD at the component level through three mechanisms:

1. **Data-oriented components** — all component definitions are plain objects, not class instances. There is no hidden state, no prototype chain to audit, no duality between functional and OOP styles. The DP (Data-oriented Programming) Adapter handles paradigm translation transparently.

2. **State halting** — instead of continuous re-render cycles, OBIX tracks state revisions and halts computation when a component's state has stabilised. This mirrors the halting principle from automata theory, applied to UI lifecycle management.

3. **Policy enforcement** — accessibility, contrast, touch target sizing, and ARIA compliance are not afterthoughts. They are enforced as named policies at component registration time, surfaced through a QA matrix in the telemetry layer.

---

## Installation

```bash
# Core runtime only
npm install @obinexusltd/obix-core

# UI primitives (Button, Input, Card, Modal)
npm install @obinexusltd/obix-components

# DP Adapter (paradigm translation)
npm install @obinexusltd/obix-adapter

# Full SDK (all packages)
npm install @obinexusltd/obix-core @obinexusltd/obix-components @obinexusltd/obix-adapter
```

### Schema modes

OBIX supports three deployment schemas, selected at install time:

| Schema | Command | Use case |
|--------|---------|----------|
| **Monoglot** | `npm install @obinexusltd/obix-core` | Node.js / TypeScript only (default, stable) |
| **Hybrid** | `npm install @obinexusltd/obix-*` | Monoglot + polyglot layer interop |
| **Polyglot** | via `libpolycall` bindings | Multi-language microservice backends |

Monoglot is the default and only fully stable schema. Polyglot and hybrid schemas are experimental and require `libpolycall` to be compiled separately.

---

## Quick Start

### 1. Define a component (data-oriented)

```typescript
import { ObixRuntime, ComponentDefinition } from '@obinexusltd/obix-core';

const runtime = new ObixRuntime();

const CounterDef: ComponentDefinition<{ count: number }> = {
  name: 'Counter',
  state: { count: 0 },
  actions: {
    increment: () => ({ count: 1 }),
    decrement: () => ({ count: -1 }),
    reset:     () => ({ count: 0 }),
  },
  render: (state) => `<div>Count: ${state.count}</div>`,
};

runtime.register(CounterDef);
const id = runtime.create('Counter');
runtime.update(id, 'increment');
```

### 2. Translate between paradigms (DP Adapter)

```typescript
import { DOPAdapter } from '@obinexusltd/obix-adapter';
import { Paradigm } from '@obinexusltd/obix-adapter';

const adapter = new DOPAdapter(CounterDef);

// Use as a functional component
const FuncCounter = adapter.toFunctional();
FuncCounter();

// Use as a class-based component
const OOPCounter = adapter.toOOP();
const instance = new OOPCounter();
instance.render();

// Use as a reactive/observable
const ReactiveCounter = adapter.toReactive();
ReactiveCounter.subscribe((state) => console.log(state));
```

### 3. Use accessible UI primitives

```typescript
import { createButton, createInput, createModal } from '@obinexusltd/obix-components';

// Button with WCAG-compliant touch targets and ARIA
const button = createButton({
  label: 'Submit',
  ariaLabel: 'Submit your form',
  variant: 'primary',
});

// Input with on-blur validation timing (not on first keystroke)
const emailInput = createInput({
  label: 'Email address',
  type: 'email',
  required: true,
  autocomplete: 'email',
  validationTiming: 'onBlur',
});

// Modal with focus trap and scroll lock
const dialog = createModal({
  title: 'Confirm action',
  closeOnEscape: true,
  closeOnBackdropClick: true,
});

dialog.actions.open();
```

### 4. Observe lifecycle events

```typescript
import { LifecycleHook } from '@obinexusltd/obix-core';

runtime.onLifecycle(LifecycleHook.HALTED, ({ instanceId, instance }) => {
  console.log(`Component ${instanceId} halted after ${instance?.revision} revisions`);
  console.log('Halt reason:', instance?.haltReason);
});
```

### 5. Enforce custom policies

```typescript
import { Policy } from '@obinexusltd/obix-core';

const NoEmptyLabels: Policy = {
  name: 'NoEmptyLabels',
  enforce: (instance) => {
    const hasLabel = instance.definition.state?.label !== '';
    return {
      passed: hasLabel,
      violations: hasLabel ? [] : [{ policy: 'NoEmptyLabels', message: 'Component must have a non-empty label' }],
    };
  },
};

runtime.register({ ...CounterDef, policies: [NoEmptyLabels] });
```

---

## Workspace Structure

```
obix-sdk/
├── packages/
│   │
│   ├── drivers/                        LAYER 1 — Native System Drivers
│   │   ├── gpu-acceleration/           WebGL/WebGPU canvas rendering
│   │   ├── dom-mutation/               Efficient DOM diffing and patching
│   │   ├── accessibility-tree/         ARIA and live region management
│   │   ├── input-event/                Unified touch/mouse/keyboard normalisation
│   │   ├── animation-frame/            requestAnimationFrame scheduling
│   │   ├── font-layout/                Text measurement and web font loading
│   │   ├── media-query/                Breakpoint detection and safe-area handling
│   │   ├── storage-persistence/        IndexedDB/LocalStorage for state cache
│   │   ├── network-stream/             WebSocket/SSE for telemetry and real-time sync
│   │   └── compositor/                 Layer management and z-index optimisation
│   │
│   ├── bindings/                       LAYER 2 — Language Bindings (libpolycall)
│   │   ├── typescript/                 Primary web runtime (stable)
│   │   ├── python/                     ML/AI integration
│   │   ├── rust/                       WebAssembly target
│   │   ├── go/                         Backend microservices
│   │   ├── cpp/                        Legacy system integration
│   │   ├── lua/                        Game engine scripting
│   │   ├── java-kotlin/                Android and enterprise
│   │   ├── swift/                      iOS/macOS native
│   │   ├── csharp/                     Unity and .NET
│   │   └── zig/                        Systems programming
│   │
│   └── sdk/                            LAYER 3 — Developer-Facing Packages
│       ├── obix-core/          ★       Runtime engine, lifecycle, state halting
│       ├── obix-components/    ★       Button, Input, Card, Modal primitives
│       ├── obix-adapter/       ★       DP Adapter — paradigm translation
│       ├── obix-telemetry/             State tracking, QA matrix, decorators
│       ├── obix-accessibility/         WCAG 2.2 enforcement, focus management
│       ├── obix-motion/                Animation respecting prefers-reduced-motion
│       ├── obix-forms/                 Validation, autocomplete, progressive enhancement
│       ├── obix-router/                SPA navigation, scroll restoration, deep linking
│       ├── obix-state/                 State machine minimisation (tennis tracker)
│       └── obix-cli/                   Build tooling, schema validation, semver-X
│
├── ARCHITECTURE.mermaid                Three-layer architecture diagram
├── PROBLEM_MAP.mermaid                 Web UX problem → package resolution map
├── package.json                        npm workspace root
└── tsconfig.base.json                  Shared TypeScript configuration

★ = fully implemented with tests
○ = typed interface stubs (ready for implementation)
```

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────────┐
│   SDK Packages (@obinexusltd/obix-*)         │  Developer writes OBIX components
│   obix-core · obix-components · obix-adapter │  using pure data objects
└─────────────────┬───────────────────────────┘
                  │ Data-oriented config objects
┌─────────────────▼───────────────────────────┐
│   Language Bindings (libpolycall)            │  Polyglot connectivity:
│   TypeScript · Python · Rust · Go · Swift   │  TS/JS → C ABI → target language
└─────────────────┬───────────────────────────┘
                  │ FFI / C ABI
┌─────────────────▼───────────────────────────┐
│   Native Drivers                             │  Platform-specific render calls:
│   DOM · GPU · Input · Storage · Network      │  browser APIs, OS primitives
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│   Operating System / Browser                 │
└─────────────────────────────────────────────┘
```

---

## Web UX Problems Addressed

OBIX is designed specifically to eliminate a class of web-native failures that do not appear in native apps or print design. Each problem maps to one or more packages.

### Performance & Loading

| Problem | Package |
|---------|---------|
| Cumulative Layout Shift (CLS) | `obix-components`, `font-layout` driver |
| Skeleton screens with dead affordances | `obix-components`, `obix-core` |
| Hydration mismatch / SSR flicker | `obix-state`, `obix-adapter` |
| Infinite scroll back-button anchor loss | `obix-router` |

### Responsive & Viewport

| Problem | Package |
|---------|---------|
| `100vh` chrome inconsistency across browsers | `media-query` driver |
| Hover-state trapping on touch devices | `input-event` driver |
| Breakpoint binary thinking (fails at tablet widths) | `media-query` driver |
| Notch / safe-area ignorance | `media-query` driver |

### Input & Interaction

| Problem | Package |
|---------|---------|
| Virtual keyboard pushing fixed nav off-screen | `media-query` driver, `input-event` driver |
| Touch target ambiguity (sub-44px hit areas) | `obix-components` (enforced minimum 44×44px) |
| iOS input zoom injection (font < 16px) | `input-event` driver |
| Drag vs scroll gesture conflict | `input-event` driver |

### Navigation & Wayfinding

| Problem | Package |
|---------|---------|
| SPA scroll position amnesia on route change | `obix-router` |
| Deep link decay (modal/tab state not URL-reflected) | `obix-router` |
| `pushState` breadcrumb that breaks back button | `obix-router` |
| `outline: none` focus ring suppression | `obix-accessibility` |

### Accessibility

| Problem | Package |
|---------|---------|
| ARIA label overload / missing icon labels | `obix-accessibility`, `accessibility-tree` driver |
| Parallax ignoring `prefers-reduced-motion` | `obix-motion`, `animation-frame` driver |
| Color contrast failure over gradients/images | `obix-accessibility` |
| Modal focus trap failure (tab escapes overlay) | `obix-components` (createModal), `obix-accessibility` |

### Forms & Data Entry

| Problem | Package |
|---------|---------|
| Autocomplete attribute neglect | `obix-forms` |
| Custom date picker overriding native mobile wheel | `obix-forms` |
| Validation triggering on first keystroke | `obix-forms` (configurable: `onChange` \| `onBlur`) |
| No upload progress / missing type/size hints | `obix-forms` |

### State & Feedback

| Problem | Package |
|---------|---------|
| Stale tab syndrome (background tab data rot) | `obix-state`, `network-stream` driver |
| Network status invisibility (silent offline) | `network-stream` driver, `obix-telemetry` |

---

## Semantic Version X

OBIX uses **Semantic Version X (semver-X)** — an extended versioning taxonomy managed by `obix-cli`. It augments the standard `MAJOR.MINOR.PATCH` model with:

- **Channel** (`alpha` | `beta` | `stable` | `lts`) — replaces pre-release suffixes
- **Code name** — human-readable stability identifier (e.g. `stable/stegosaurus`)
- **Hot-swappable layers** — stable components can be swapped across versions without full rebuilds
- **Schema lock** — prevents dependency mismatches between monoglot/polyglot/hybrid schemas

```
@obinexusltd/obix-core@0.1.0-alpha.stegosaurus
                        ─┬── ──┬── ──────┬─────
                         │     │         └── code name (human label)
                         │     └──────────── channel (alpha/beta/stable/lts)
                         └────────────────── semver base
```

---

## Development

### Requirements

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0 (workspaces support)

### Setup

```bash
git clone https://github.com/obinexuscomputing/obix-sdk
cd obix-sdk
npm install
```

### Build all packages

```bash
npm run build
```

### Run tests

```bash
npm run test
```

### Build a single package

```bash
npm run build --workspace packages/sdk/obix-core
```

### Test results

```
Test Files  3 passed (3)
     Tests  117 passed (117)
  Duration  ~1.3s
```

---

## Roadmap

| Milestone | Status | Description |
|-----------|--------|-------------|
| DP Adapter MVP | ✅ Complete | Functional/OOP/Reactive/Data paradigm translation |
| State Halting Engine | ✅ Complete | Stability-based computation halting |
| UI Primitives (Button/Input/Card/Modal) | ✅ Complete | WCAG 2.2 compliant, FUD-mitigated |
| Telemetry + QA Matrix | 🔧 Stub | Policy decorator system |
| Accessibility Engine | 🔧 Stub | WCAG audit, contrast, focus manager |
| Motion System | 🔧 Stub | `prefers-reduced-motion` animation layer |
| Forms Engine | 🔧 Stub | Validation, autocomplete, file upload |
| Router | 🔧 Stub | SPA navigation, scroll restoration |
| State Machine Minimisation | 🔧 Stub | Tennis tracker algorithm |
| CLI + semver-X | 🔧 Stub | Build tooling, schema validation |
| libpolycall C ABI | 🔧 Planned | FFI bridge for polyglot bindings |
| Polyglot bindings | 🔧 Planned | Python, Rust, Go, Swift, etc. |

---

## Contributing

OBINexus operates under the **#NoGhosting** policy. If you open an issue or pull request, you will receive a response. If a contribution is declined, you will be told why.

All contributions must pass:
- TypeScript strict mode with no `any` escapes in public APIs
- The OBIX policy framework (accessibility, touch targets, ARIA)
- The QA matrix (true positive / true negative / false positive classification)

---

## About OBINexus

OBINexus Computing is a software engineering practice founded by Nnamdi Okpala. The name combines *OBI* (Igbo: heart, soul) with *Nexus* (Latin: connection, link). The project philosophy holds that good software is built like a good relationship — with honesty, structure, and respect for the person on the other side of the interface.

> "OBIX is not a framework. It is a philosophy expressed as a library."
