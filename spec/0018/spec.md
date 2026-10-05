# Feedback 0018 — Build pipeline failed

| Field | Value |
|-------|-------|
| Ticket | `0018` |
| Feedback id | `_7h_nA7Tn6JD0rdVcujSP` |
| Type | `bug` |
| Title | Build pipeline faild |
| Reporter | n.rishee@gmail.com |
| Attachment | none |

## Overview

Staging deploy fails while packaging the desktop Electron installer under `desktop/`. The self-hosted Windows runner reports `WebAssembly.Memory(): could not allocate memory` and aborts the WebOnOne deploy, blocking IIS staging even when only the web app needs to ship.

## Problem / goal

**Error (from report):**

```text
⨯ …\node.exe process failed 1
Error: WebAssembly.Memory(): could not allocate memory
npm error path C:\Projects\desktop
```

`webonone-v2` `deploy` runs `npm run build:desktop` (electron-builder NSIS) before staging IIS output. The staging host has ~4 GB RAM; after IIS/Node workloads, free memory is often far below what electron-builder’s WASM path needs. That turns an optional installer package into a hard deploy failure.

**Goal:** Staging / IIS deploy for WebOnOne must succeed when desktop packaging cannot run due to memory. Desktop installer build remains available via `npm run build:desktop` on a machine with enough RAM. If a prior `WebOnOne-Setup.exe` exists, staging should still copy it when present.

## Acceptance criteria

1. `npm run deploy -w webonone-v2-root` (or root `deploy:webonone`) does **not** fail solely because electron-builder OOMs or is skipped for low free RAM.
2. Deploy still builds WebOnOne frontend/backend and stages `webonone-v2/deploy` for IIS.
3. When `desktop/release/WebOnOne-Setup.exe` exists, `tooling/stage-iis-deploy.mjs` continues to copy it to `deploy/public/downloads/` (unchanged).
4. When desktop packaging is skipped or fails, deploy logs a clear warning and continues (no silent success without a message).
5. Hard `npm run build:desktop` still runs electron-builder for ops on capable hosts (unchanged contract for intentional installer builds).
6. Docs (`webonone-v2/deploy/IIS.md` and/or `tooling/CICD.md`) note that staging hosts with low RAM may skip installer packaging.
7. Touched workspaces pass applicable verification (`node` script sanity; `npm run type-check -w @webonone/desktop` if desktop config changes).

## Services affected

| Area | Change |
|------|--------|
| `tooling/` | Resilient desktop-for-deploy helper |
| `webonone-v2/` | `deploy` script uses helper instead of hard `build:desktop` |
| `tooling/CICD.md`, `webonone-v2/deploy/IIS.md` | Document skip / soft-fail behavior |
| `spec/0018/` | This package |

## Out of scope

- Upgrading staging host RAM (ops; document only)
- Changing Electron app behavior or NSIS product config
- Separate GitHub Actions job for desktop on a larger runner
- Setting Support status `closed`

## Verification

```bash
node --check tooling/build-desktop-for-deploy.mjs
npm run type-check -w @webonone/desktop
```

Manual / deploy: with low free RAM, WebOnOne deploy completes past the desktop step with a skip/warn log; IIS stage still produced.
