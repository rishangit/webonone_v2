# Development summary — Feedback 0012

| Field | Value |
|-------|-------|
| Ticket | `0012` |
| Feedback id | `pBe8qjkMjqHNUkXnL6fNX` |
| Title | Need to improve deployment |
| Type | `feature` |
| Completed | `2026-10-04` |

## What was delivered

Staging deploy no longer always runs full `migrate:all` + `deploy:all`. The workflow detects which IIS services changed in the push (via git diff + `tooling/deploy-services.json`) and migrates/builds/stages/recycles/smokes only those services. Shared paths (`packages/`, `ui-kit/`, `tooling/`, root lockfile, etc.) still force a full deploy. `workflow_dispatch` supports `force_all` and an explicit `services` list. Spec-only pushes skip deploy entirely.

## Where to see it

| Surface | How |
|---------|-----|
| GitHub Actions | **Deploy staging** on push to `deploy_staging` — log step **Detect deploy targets** shows `mode=selective\|all\|none` |
| Manual dispatch | Actions → Deploy staging → `force_all` / `services` |
| Docs | `tooling/CICD.md` (Selective vs full) |
| Local / ops | `npm run deploy:detect -- --base HEAD~1 --head HEAD --print` then `npm run deploy:changed -- --services support` |

## Feature details

- Service keys: `identity`, `webonone` (+ `desktop/`), `media`, `email`, `data`, `sms`, `payment`, `website`, `design`, `ai`, `support`
- Selective recycle via `IIS_APP_POOLS`; selective smoke via `resolve-smoke-urls.mjs` (respects repo `SMOKE_HEALTH_URLS` host overrides)
- Empty / non-service diffs (`spec/` only) → mode `none` (no IIS work)
- First push that includes this ticket’s `tooling/` changes will itself run a **full** deploy (expected force-full rule)

## Code and docs touched

| Area | Paths |
|------|-------|
| Tooling | `tooling/deploy-services.json`, `detect-changed-services.mjs`, `deploy-changed.mjs`, `resolve-smoke-urls.mjs`, `recycle-iis-app-pools.ps1`, `smoke-production-health.ps1`, `CICD.md` |
| Workflow | `.github/workflows/deploy-staging.yml` |
| Root | `package.json` (`deploy:changed`, `deploy:detect`) |
| Rules | `.cursor/rules/iis-deployment.mdc` |
| Spec | `spec/0012/*` |

## Verification run

```bash
node --check tooling/detect-changed-services.mjs
node --check tooling/deploy-changed.mjs
node --check tooling/resolve-smoke-urls.mjs
node tooling/detect-changed-services.mjs --services support --print
node tooling/detect-changed-services.mjs --files <synthetic support-only list> --print
node tooling/detect-changed-services.mjs --files <packages/ path> --print  # mode=all
node tooling/detect-changed-services.mjs --files <spec-only> --print  # mode=none
node tooling/resolve-smoke-urls.mjs --services support,data
node tooling/deploy-changed.mjs --mode none
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0012: Need to improve deployment` |
| CI | Push runs `.github/workflows/deploy-staging.yml` (this change under `tooling/` → full deploy once) |

## Support status

`staging` after successful push (`closed` remains super admin).
