# Development summary — Feedback 0018

| Field | Value |
|-------|-------|
| Ticket | `0018` |
| Feedback id | `_7h_nA7Tn6JD0rdVcujSP` |
| Title | Build pipeline faild |
| Type | `bug` |
| Completed | `2026-10-05` |

## What was delivered

WebOnOne IIS deploy no longer hard-fails when electron-builder cannot allocate WASM memory on the ~4 GB staging host. Deploy uses `tooling/build-desktop-for-deploy.mjs`, which skips packaging when free RAM is below 1.5 GB (or `SKIP_DESKTOP_BUILD=1`), soft-fails on builder errors, and always exits 0 so staging continues. Intentional packaging remains `npm run build:desktop`. Docs updated in IIS.md and CICD.md.

## Where to see it

| Surface | How |
|---------|-----|
| Staging deploy log | Push to `deploy_staging` → Deploy staging → look for `[build-desktop-for-deploy] Skipping desktop installer` (or success) during webonone deploy |
| Local helper | `node tooling/build-desktop-for-deploy.mjs` (skips on low free RAM) |
| Hard installer build | `npm run build:desktop` on a host with enough RAM |
| Support docs | N/A (ops/deploy bug; no user-facing product change) |

## Feature details

- Skip threshold: free physical memory &lt; 1.5 GB.
- Soft-fail: electron-builder non-zero exit does not fail deploy.
- Existing `desktop/release/WebOnOne-Setup.exe` is still staged when present.
- `CSC_IDENTITY_AUTO_DISCOVERY=false` when a build is attempted.

## Code and docs touched

| Root | Paths |
|------|-------|
| `tooling/` | `build-desktop-for-deploy.mjs`, `CICD.md` |
| `webonone-v2/` | `package.json` (`deploy`), `deploy/IIS.md`, `frontend/public/downloads/README.md` |
| `desktop/` | `README.md` |
| `spec/0018/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
node --check tooling/build-desktop-for-deploy.mjs
node tooling/build-desktop-for-deploy.mjs
npm run type-check -w @webonone/desktop
```

Helper skipped with free RAM ~118 MB (exit 0). Desktop type-check passed.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0018: soft-skip desktop build on low-RAM staging` |
| Workflow | `.github/workflows/deploy-staging.yml` (push trigger) |

## Support status

`staging` after successful push (`closed` remains super admin).
