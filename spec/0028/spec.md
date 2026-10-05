# Feedback 0028 — Need to improve the build pipeline

| Field | Value |
|-------|-------|
| Ticket | `0028` |
| Feedback id | `kpZfr-uzPJdKzl-KYMFlc` |
| Type | `feature` |
| Title | Need to improve the build pipeline |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Feedback 0012 added selective staging deploy, but most real pushes still rebuild **every** IIS service because any change under `packages/` or `ui-kit/` (and any file under `tooling/`) forces `mode=all`. Spec-only / non-IIS changes also still pay for `npm install` before the skip path runs. Improve detection and workflow ordering so only affected services build, and the skip path runs early when nothing deployable changed.

## Problem / goal

**Problem:**

1. Deploy still often builds all services — blanket `forceFullPathPrefixes` for `packages/`, `ui-kit/`, and `tooling/` turn typical shared-package or docs edits into full `migrate:all` + `deploy:all` (e.g. `packages/mobile-ui` alone, which is not an IIS site).
2. The **Skip deploy** path is late: `npm install` always runs before detection, so “no service changes” still spends minutes installing before the skip step.
3. Operators need clearer selection: git auto-detect should map shared libraries to **consumer services**, and `workflow_dispatch` / `deploy:changed --services` remain available for manual selection.

**Goal (MVP):** Tighten the build/deploy pipeline so changed paths select only the corresponding IIS services (or skip entirely), with early short-circuit when there is nothing to deploy.

## Acceptance criteria

1. Changes under a **single service root** (e.g. `support/`) still deploy **only** that service (unchanged from 0012).
2. Changes under **shared libraries** map to **consumer IIS services** via config (not blanket `mode=all` for all of `packages/`):
   - `packages/mobile-ui/` and `mobile/` alone → `mode=none` (no IIS deploy).
   - Packages with a consumer subset (e.g. `media-embed`, `store-kit`) → `mode=selective` for those consumers only.
   - Libraries that affect every IIS frontend (`ui-kit/`, `packages/theme/`, `packages/i18n/`) may still resolve to a full deploy (`mode=all`) when the consumer set is complete.
3. Non-deployable paths (`spec/`, `.cursor/`, docs-only tooling such as `tooling/CICD.md`, support-feedback MCP tooling) alone → `mode=none`.
4. Only **deploy-critical** tooling / root lockfile / workflow files force full deploy (narrowed list; not every file under `tooling/`).
5. Workflow runs **Detect deploy targets before `npm install`**. When `mode=none`, **Skip deploy** runs and **skips** install, env:apply, migrate, recycle, and smoke.
6. An always-on **Deploy summary** step logs mode, services, and reason after the migrate/skip branch.
7. `workflow_dispatch` `force_all` / `services` and `npm run deploy:changed` / `deploy:detect` keep working; `tooling/CICD.md` documents the new rules.
8. Verification: detector dry-runs with synthetic path lists; `node --check` on touched tooling scripts.

## Services affected

| Area | Change |
|------|--------|
| `tooling/deploy-services.json` | Shared-library → consumer map; ignore prefixes; narrowed force-full paths |
| `tooling/detect-changed-services.mjs` | Use the map; promote full set → `mode=all` |
| `.github/workflows/deploy-staging.yml` | Detect before install; skip install on `none`; summary step |
| `tooling/CICD.md` | Document improved rules |
| `spec/0028/` | This package |

## Out of scope

- Parallelizing per-service builds inside a full deploy
- Skipping package rebuilds inside a single service’s `npm run build` when `dist/` is warm
- Changing IIS site layout, `web.config`, or `production.env` shape
- Making PR `ci.yml` path-filtered (separate concern)
- Setting Support status `closed`

## Verification

```bash
node --check tooling/detect-changed-services.mjs
node tooling/detect-changed-services.mjs --files <support-only> --print          # selective support
node tooling/detect-changed-services.mjs --files <mobile-ui-only> --print        # none
node tooling/detect-changed-services.mjs --files <ui-kit> --print                # all (all consumers)
node tooling/detect-changed-services.mjs --files <media-embed> --print           # selective consumers
node tooling/detect-changed-services.mjs --files <spec-only> --print             # none
node tooling/detect-changed-services.mjs --files <tooling/CICD.md> --print       # none
node tooling/detect-changed-services.mjs --services support,data --print
```
