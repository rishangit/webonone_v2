# Development summary — Feedback 0028

| Field | Value |
|-------|-------|
| Ticket | `0028` |
| Feedback id | `kpZfr-uzPJdKzl-KYMFlc` |
| Title | Need to improve the build pipeline |
| Type | `feature` |
| Completed | `2026-10-05` |

## What was delivered

Staging deploy detection no longer treats all of `packages/`, `ui-kit/`, or `tooling/` as force-full. Shared libraries map to IIS consumer services; `packages/mobile-ui` / `mobile` / `spec` / docs-only tooling resolve to `mode=none`. The workflow detects **before** `npm install`, so skip runs early without install. An always-on **Deploy summary** step logs mode, services, and reason after migrate or skip.

## Where to see it

| Surface | How |
|---------|-----|
| GitHub Actions | **Deploy staging** — step order: Detect → Skip (if none) or Install → … → **Deploy summary** |
| Manual dispatch | Actions → Deploy staging → `force_all` / `services` |
| Docs | `tooling/CICD.md` (Selective vs full + shared library table) |
| Local / ops | `npm run deploy:detect -- --base HEAD~1 --head HEAD --print` |

## Feature details

- `sharedLibraries` in `tooling/deploy-services.json` drives package → consumer selection
- Full set of consumers → `mode=all` (uses `deploy:all` once); subset → `selective`; empty → `none`
- Force-full limited to lockfile, `production.env.example`, deploy workflow, and listed deploy-critical tooling files
- This push itself touches deploy-critical detector/config/workflow → one expected full deploy

## Code and docs touched

| Area | Paths |
|------|-------|
| Tooling | `tooling/deploy-services.json`, `detect-changed-services.mjs`, `CICD.md` |
| Workflow | `.github/workflows/deploy-staging.yml` |
| Rules | `.cursor/rules/iis-deployment.mdc` |
| Spec | `spec/0028/*` |

## Verification run

```bash
node --check tooling/detect-changed-services.mjs
node --check tooling/deploy-changed.mjs
node tooling/detect-changed-services.mjs --files <support-only> --print  # selective support
node tooling/detect-changed-services.mjs --files <mobile-ui-only> --print  # none
node tooling/detect-changed-services.mjs --files <ui-kit> --print  # all
node tooling/detect-changed-services.mjs --files <media-embed> --print  # selective consumers
node tooling/detect-changed-services.mjs --files <store-kit> --print  # selective (no website)
node tooling/detect-changed-services.mjs --files <spec-only> --print  # none
node tooling/detect-changed-services.mjs --files <tooling/CICD.md> --print  # none
node tooling/detect-changed-services.mjs --services support,data --print
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0028: Need to improve the build pipeline` |
| CI | Push runs `.github/workflows/deploy-staging.yml` (detector/config/workflow → full deploy once) |

## Support status

`staging` after successful push (`closed` remains super admin).
