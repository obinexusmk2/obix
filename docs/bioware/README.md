# OBIX Bioware Migration

This directory tracks the migration from the older DOP-heavy build workflow to a **Bioware** workflow.

## Naming

- Correct term: **Bioware**
- Expanded form: **BI**ological hard**WARE**

## Delivery sequence

The build migration is intentionally staged in this strict order:

1. `version1` (baseline esbuild bundle)
2. `version2` (controller/control/controllee layer outputs)
3. `version3` (ESM and CJS output)
4. `version4` (minified release + type declarations)

Use:

```bash
npm run build:bioware
```

## Controller / Control / Controllee

- **Controller**: user-facing biological signal capture (`src/controller/index.ts`)
- **Control**: force translation protocol (`src/control/index.ts`)
- **Controllee**: execution target enforcing the 10% stability threshold (`src/controllee/index.ts`)
