# OBIX Bioware (BIological hardWARE)

Bioware is the next iteration of OBIX: a biological interface model using **Controller -> Control -> Controllee** layering and a lightweight esbuild-first toolchain.

## What changed

- ✅ Terminology corrected from **Boware** to **Bioware**.
- ✅ Build system now supports **esbuild** for fast ESM/CJS/bioware bundle output.
- ✅ Control architecture is explicitly separated into:
  - **Controller**: captures biological input.
  - **Control**: translates input into commands via `F=ma` and the 10% stability rule.
  - **Controllee**: executes control signals.

## Version progression

The migration is represented in four progressive versions:

- **v1**: controller foundations (input capture + tripolar state classification).
- **v2**: control protocol (`F=ma`) and control-signal translation.
- **v3**: controllee execution layer and 10% stability filtering.
- **v4**: integrated end-to-end Bioware pipeline.

Use:

```ts
import { runBiowareSequence } from '@obinexusmk2/obix';

const versions = runBiowareSequence();
console.log(versions);
```

## Build

```bash
npm run build:esbuild
npm run build:types
npm run build:rollup
# or
npm run build:all
```

Outputs:

- `dist/esm/index.js`
- `dist/cjs/index.js`
- `dist/bioware/bioware.js`
- `dist/umd/bioware.min.js`
- `dist/types/index.d.ts`

## Source layout

```text
src/
├── bioware/
│   ├── types.ts
│   └── versions.ts
├── controller/
│   └── index.ts
├── control/
│   └── index.ts
├── controllee/
│   └── index.ts
└── index.ts
```
