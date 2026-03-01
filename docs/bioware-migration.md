# OBIX -> Bioware Migration (v1 -> v4)

This repository now contains a staged migration path that follows the requested order:

## Version 1
- Introduced the three-layer architecture:
  - `controller` (user input)
  - `control` (command protocol, including F=ma)
  - `controllee` (target system execution)
- Added shared types in `src/bioware/types.ts`.

## Version 2
- Added `scripts/build/esbuild.config.cjs` to produce:
  - `dist/esm/index.js`
  - `dist/cjs/index.js`

## Version 3
- Added `rollup.config.mjs` for layer bundles and UMD distribution.
- Added `tsconfig.bioware.json` for isolated declaration generation.
- Added package scripts to support esbuild/rollup workflow.

## Version 4
- Documented the migration and established a single staged command path:
  - `npm run build:v2`
  - `npm run build:v3`
  - `npm run build:v4`

## Notes
- Existing legacy OBIX code remains in place for backward compatibility.
- The new Bioware path is additive and can be adopted incrementally.
