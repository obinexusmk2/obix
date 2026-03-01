# Isolated Code

Code in this directory was quarantined from the production build pipeline on 2026-03-01.

## Why

The OBIX project is migrating from the legacy `src/core/` architecture to the Bioware architecture (`src/bioware/`, `src/controller/`, `src/control/`, `src/controllee/`). At time of isolation, the legacy code had **1,516 TypeScript build errors** across `src/core/` (1,448 errors) and `src/cli/` (68 errors), while the Bioware code compiled cleanly with zero errors.

## Contents

| Directory | Description |
|-----------|-------------|
| `src/core/` | Legacy core framework (parser, AST, DOP, validation, IoC, etc.) |
| `src/cli/` | Prototype CLI tooling (mostly stub implementations) |
| `tests/` | Unit and integration tests for core/cli modules |
| `old/` | Legacy DOP code |
| `poc/` | Proof of concept experiments |
| `backup/` | Timestamped backups |
| `.backup/` | Configuration backups |
| `demos/` | Demo files |
| `examples/` | Example projects |
| `tools/` | Analysis and testing utilities |
| `project/` | Project planning documentation |
| `readmes/` | Documentation files |
| `assets/` | Design assets (branding, media, templates) |

## Restoring Code

To restore any isolated module back into the main codebase:

```bash
git mv isolated/src/core/ src/core/
git mv isolated/src/cli/ src/cli/
```

You will need to update `tsconfig.json` path aliases, `package.json` scripts, and Jest configurations accordingly.
