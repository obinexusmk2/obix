# OBIX SDK Publish & Installation Workflow

This document defines the exact publish/install workflow for all scoped npm workspace packages in this monorepo.

## 1) Prerequisites

Before publishing any package under `@obinexusltd`:

- You must have an npm account (`https://www.npmjs.com/signup`).
- You must be a member of the npm organization scope: `@obinexusltd`.
- You must be authenticated locally:

```bash
npm login
```

- Your org role must allow publishing scoped packages for `@obinexusltd` (typically **Owner** or **Maintainer** with publish rights).
- If org-level 2FA is required, ensure your account is configured for npm publish operations.

## 2) Version Policy (Baseline)

Current baseline policy for this repository:

- All OBIX SDK, driver, and binding workspace packages start at version **`0.1.0`**.
- Keep versions aligned unless an explicit release plan requires divergence.
- For new packages, initialize at `0.1.0` under the `@obinexusltd` scope.

## 3) Build & Publish From `obix-sdk/` Root

From the monorepo root (`obix-sdk/`):

```bash
npm install
npm run build
```

Publish a single workspace package using:

```bash
npm publish --workspace <workspace-path> --access public
```

Examples:

```bash
npm publish --workspace packages/sdk/obix-core --access public
npm publish --workspace packages/drivers/animation-frame --access public
npm publish --workspace packages/bindings/typescript --access public
```

## 4) Batch Publish Examples by Workspace Group

Run these from `obix-sdk/`.

### Bindings (`packages/bindings/*`)

```bash
for pkg in packages/bindings/*; do
  npm publish --workspace "$pkg" --access public
done
```

### Drivers (`packages/drivers/*`)

```bash
for pkg in packages/drivers/*; do
  npm publish --workspace "$pkg" --access public
done
```

### SDK (`packages/sdk/*`)

```bash
for pkg in packages/sdk/*; do
  npm publish --workspace "$pkg" --access public
done
```

> Tip: run `npm run build` before each batch to ensure artifacts are current.

## 5) Consumer Install Examples

Install all matching OBIX packages in scope with wildcard:

```bash
npm i @obinexusltd/obix-*
```

Install specific packages explicitly:

```bash
npm i @obinexusltd/obix-core
npm i @obinexusltd/obix-components
npm i @obinexusltd/obix-driver-animation-frame
npm i @obinexusltd/obix-binding-typescript
```

Install pinned versions if needed:

```bash
npm i @obinexusltd/obix-core@0.1.0
```

## 6) Troubleshooting Common npm Scope/Auth Errors

### `401 Unauthorized`

Symptoms:
- `npm ERR! code E401`
- Authentication/token errors during publish/install.

Fixes:
- Re-authenticate: `npm login`
- Verify active account: `npm whoami`
- If using a token in CI, confirm `NPM_TOKEN` is valid and not expired/revoked.

### `403 Forbidden` (org/scope permissions)

Symptoms:
- `npm ERR! code E403`
- Message indicates you cannot publish to `@obinexusltd`.

Fixes:
- Confirm npm org membership for `@obinexusltd`.
- Confirm role includes publish rights for the package.
- Ensure package name is correctly scoped (e.g., `@obinexusltd/obix-core`).
- Ensure you are publishing with public access:
  - `npm publish --workspace <workspace-path> --access public`

### `403` / "You cannot publish over the previously published versions"

Symptoms:
- Publish rejected because that exact package version already exists.

Fixes:
- Bump package version (e.g., `npm version patch --workspace <workspace-path>`), then republish.
- Never attempt to overwrite an existing version on npm.

### Package name already exists / conflict

Symptoms:
- Publish fails because package identity is unavailable or already used.

Fixes:
- Ensure the package name is unique inside the `@obinexusltd` scope.
- Confirm `name` in the package `package.json` matches the intended scoped name.
- If this is a rename, update internal dependencies/imports before publishing.
