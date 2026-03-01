# OBIX Bioware Migration: Version 1 → Version 4

This document tracks the requested migration sequence in four stages.

## Version 1 — Terminology + Build Foundation

- Renamed strategy language from **Boware** to **Bioware**.
- Added an esbuild-based build entry at `scripts/build/esbuild.config.cjs`.
- Added scripts for fast builds and layered builds in `package.json`.

## Version 2 — Three-Layer Architecture

- Added `src/controller/index.ts` for biological input capture.
- Added `src/control/index.ts` for F=ma-based control translation.
- Added `src/controllee/index.ts` for device execution with 10% stability rule.

## Version 3 — Unified Public API

- Reworked `src/index.ts` to export Controller/Control/Controllee APIs.
- Added `runBiowareCycle` to execute a full controller→control→controllee pass.

## Version 4 — Bundle Targets + Rollup UMD

- Added `rollup.config.cjs` to produce:
  - per-layer ESM + CJS bundles
  - UMD browser bundle (`dist/umd/bioware.min.js`)
- Added corresponding package scripts.

## Final Commit Outcome

- Sequence is implemented in the requested order (v1 → v2 → v3 → v4).
- Changes are prepared for merge via PR to `main`.
