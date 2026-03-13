# UX Risk Coverage Matrix

This matrix maps 30 UX risk categories to concrete OBIX package APIs and integration tests.

| # | UX Risk Category | Package Feature(s) | API/Behavior Coverage | Integration Test Coverage |
|---|---|---|---|---|
| 1 | Deep-link decay across refresh | `obix-router` deep-link serialization | `createRouter(...).navigate()` + `getDeepLink()` with `deepLink.enabled` | `packages/sdk/obix-router/__tests__/integration.test.ts` |
| 2 | Incomplete route-state hydration | `obix-router` deep-link parsing fallback | `deepLink.parseState` + default parser in `createRouter` | `packages/sdk/obix-router/__tests__/integration.test.ts` |
| 3 | SPA scroll amnesia | `obix-router` scroll restoration | `restoreScroll()` and automatic `scrollTo(0,0)`/saved positions | `packages/sdk/obix-router/__tests__/integration.test.ts` |
| 4 | Infinite-scroll anchor loss | `obix-router` anchor-aware restoration | Saved `anchorId` + `scrollIntoView` on restore | `packages/sdk/obix-router/__tests__/integration.test.ts` |
| 5 | Lost route context on browser back | `obix-router` history integration | `back()`, `forward()`, `popstate` listener | `packages/sdk/obix-router/__tests__/integration.test.ts` |
| 6 | Guard bypass during unsafe navigation | `obix-router` navigation guards | `registerGuard()` + `beforeNavigate/afterNavigate` execution | `packages/sdk/obix-router/__tests__/integration.test.ts` |
| 7 | Motion-triggered vestibular discomfort | `obix-motion` reduced-motion enforcement | `respectReducedMotion()` + `skipAnimations` policy | `packages/sdk/obix-motion/__tests__/integration.test.ts` |
| 8 | Ignored OS accessibility motion setting | `obix-motion` media query strategy | `window.matchMedia('(prefers-reduced-motion: reduce)')` | `packages/sdk/obix-motion/__tests__/integration.test.ts` |
| 9 | No-motion fallback causes visual break | `obix-motion` safe fallback styles | Instant terminal keyframe apply with `instantDuration` | `packages/sdk/obix-motion/__tests__/integration.test.ts` |
| 10 | Sequenced animations stall usability | `obix-motion` deterministic sequencing | `sequence()` serially resolves reduced/normal flows | `packages/sdk/obix-motion/__tests__/integration.test.ts` |
| 11 | Missing focus target after interaction | `obix-accessibility` focus manager | `getFocusManager().setFocus/getFocusedElement` | `packages/sdk/obix-accessibility/__tests__/integration.test.ts` |
| 12 | Focus not restored after transient UI | `obix-accessibility` focus state restore | `saveFocusState()` + `restoreFocusState()` | `packages/sdk/obix-accessibility/__tests__/integration.test.ts` |
| 13 | Modal keyboard escape (focus leak) | `obix-accessibility` modal focus trap | `enforceFocus(true, container)` + keyboard cycle logic | `packages/sdk/obix-accessibility/__tests__/integration.test.ts` |
| 14 | Reverse-tab escapes modal | `obix-accessibility` shift-tab handling | Trap handler loops focus to last focusable | `packages/sdk/obix-accessibility/__tests__/integration.test.ts` |
| 15 | Silent dynamic updates for SR users | `obix-accessibility` live region announcements | `announceToScreenReader(message, priority)` | `packages/sdk/obix-accessibility/__tests__/integration.test.ts` |
| 16 | Undetected low-contrast regressions | `obix-accessibility` contrast validation | `validateContrast(element)` vs configured minimum | `packages/sdk/obix-accessibility/__tests__/integration.test.ts` |
| 17 | No pipeline hook for contrast QA | `obix-accessibility` contrast audit hooks | `registerContrastAuditHook()` callback pipeline | `packages/sdk/obix-accessibility/__tests__/integration.test.ts` |
| 18 | Inconsistent WCAG focus policy coverage | `obix-accessibility` audit baseline | `audit()` emits focus-related violations/passes | `packages/sdk/obix-accessibility/__tests__/integration.test.ts` |
| 19 | Premature validation interrupts typing | `obix-forms` timing strategy | `setValidationTiming('onBlur'|'onChange'|'onSubmit')` | `packages/sdk/obix-forms/__tests__/integration.test.ts` |
| 20 | Late validation misses early guidance | `obix-forms` event gating helper | `shouldValidateOn(event)` for flow orchestration | `packages/sdk/obix-forms/__tests__/integration.test.ts` |
| 21 | Required-field omissions | `obix-forms` required checks | `validate()` adds required-field errors | `packages/sdk/obix-forms/__tests__/integration.test.ts` |
| 22 | Rule-level validation drift | `obix-forms` explicit validation rules | `ValidationRule.validate()` + message aggregation | `packages/sdk/obix-forms/__tests__/integration.test.ts` |
| 23 | Autocomplete attribute neglect | `obix-forms` autocomplete enforcement | Warning on required fields without autocomplete | `packages/sdk/obix-forms/__tests__/integration.test.ts` |
| 24 | Incorrect autocomplete semantics | `obix-forms` typed autocomplete assignment | `enableAutocomplete(fieldName, type)` strict enum | `packages/sdk/obix-forms/__tests__/integration.test.ts` |
| 25 | Submission proceeds with invalid data | `obix-forms` submit gate | `submit()` throws on invalid validation result | `packages/sdk/obix-forms/__tests__/integration.test.ts` |
| 26 | Offline transitions not observable | `obix-telemetry` network monitoring | Auto `network.offline` and `network.online` events | `packages/sdk/obix-telemetry/__tests__/integration.test.ts` |
| 27 | Hidden/stale tabs not instrumented | `obix-telemetry` visibility monitoring | `tab.stale` event on `visibilitychange` when hidden | `packages/sdk/obix-telemetry/__tests__/integration.test.ts` |
| 28 | Critical events dropped by policy layer | `obix-telemetry` decorator chain | `createPolicyDecorator()` + `track()` transform flow | `packages/sdk/obix-telemetry/__tests__/integration.test.ts` |
| 29 | Weak debugging signal for UX incidents | `obix-telemetry` event querying | `query({ eventType, severity })` for diagnosis | `packages/sdk/obix-telemetry/__tests__/integration.test.ts` |
| 30 | No quality rollup for triage | `obix-telemetry` QA matrix aggregation | `getQAMatrix()` severity-derived counters | `packages/sdk/obix-telemetry/__tests__/integration.test.ts` |

## Package Integration Test Index

- `packages/sdk/obix-router/__tests__/integration.test.ts`
- `packages/sdk/obix-motion/__tests__/integration.test.ts`
- `packages/sdk/obix-accessibility/__tests__/integration.test.ts`
- `packages/sdk/obix-forms/__tests__/integration.test.ts`
- `packages/sdk/obix-telemetry/__tests__/integration.test.ts`
