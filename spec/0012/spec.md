# Feedback 0012 — Need to improve deployment

| Field | Value |
|-------|-------|
| Ticket | `0012` |
| Feedback id | `pBe8qjkMjqHNUkXnL6fNX` |
| Type | `feature` |
| Title | Need to improve deployment |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Staging deploys currently always run a full `deploy:all` (every microservice build + IIS stage). Add selective staging deploy so only services that changed in the push are built, migrated, staged, recycled, and smoke-checked — falling back to a full deploy when shared or cross-cutting paths change.

## Problem / goal

When code lands on `deploy_staging`, [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) always runs `npm run migrate:all` and `npm run deploy:all`. That rebuilds and stages identity, WebOnOne, media, email, data, SMS, payment, website, design, AI, and support even when only one service changed. Feedback asks for a way to deploy only the services that were developed to speed staging.

**Goal (MVP):** On push to `deploy_staging`, detect which deployable service roots changed vs the previous commit on that branch, and run migrate + deploy + recycle + smoke for those services only. Keep an explicit full-deploy path when detection cannot safely narrow the set (shared packages, root tooling, first deploy, or manual override).

## Acceptance criteria

1. Push to `deploy_staging` that only touches one or more service trees (e.g. `support/`, `data/`) runs migrate + build/stage for **those services only**, not `deploy:all`.
2. Changes under shared surfaces that affect many consumers (`packages/`, `ui-kit/`, root `package.json`, `package-lock.json`, `production.env.example`, `tooling/` deploy scripts, `.github/workflows/deploy-staging.yml`) trigger a **full** deploy (same outcome as today’s `migrate:all` + `deploy:all`).
3. `workflow_dispatch` supports override: force full deploy, and/or an explicit comma-separated service list (bypassing auto-detect).
4. When selective mode runs, IIS recycle and health smoke target only the selected services’ pools/URLs (full mode keeps current all-service behavior).
5. `tooling/CICD.md` documents selective vs full rules and the dispatch inputs.
6. Root exposes a script (e.g. `npm run deploy:changed`) usable on the ops machine with the same detection/override rules.
7. No product frontend/backend feature changes required for this ticket; verification is Node tooling + workflow consistency (run the detector unit-style / dry-run locally).

## Services affected

| Area | Change |
|------|--------|
| `tooling/` | Detect changed services; selective deploy orchestrator; smoke/recycle filters |
| `.github/workflows/deploy-staging.yml` | Use selective path; dispatch inputs |
| `package.json` (root) | `deploy:changed` (and helpers if needed) |
| `tooling/CICD.md` | Document behavior |
| `spec/0012/` | This package |

## Out of scope

- Changing per-service IIS site layout or `web.config`
- Parallelizing builds inside a full deploy
- Skipping `npm install` / `env:apply` on selective deploys (still run once per workflow)
- Deploying desktop installer as its own IIS site (desktop stays tied to WebOnOne deploy when `desktop/` or `webonone-v2/` changes)
- Setting Support status `closed`

## Verification

```bash
node tooling/detect-changed-services.mjs --help
node tooling/detect-changed-services.mjs --base HEAD~1 --head HEAD --print
# With a synthetic path list / dry-run of deploy:changed where safe on the ops machine
```

Manual: push a single-service change to `deploy_staging` and confirm the Actions log lists only that service for migrate/deploy/smoke; dispatch with `force_all=true` and confirm full deploy.
