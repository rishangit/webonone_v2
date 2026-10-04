# Plan — Feedback 0012

## Approach

Keep `deploy:all` as the full path. Add git-based service detection plus a root orchestrator that runs existing per-service `migrate:*` / `deploy:*` scripts. Wire `deploy-staging.yml` to use the orchestrator after sync, with dispatch overrides. Filter recycle pools and smoke URLs to the selected set.

## Service map

| Key | Paths that select it | Root scripts |
|-----|----------------------|--------------|
| `identity` | `identity/` | `migrate:identity`, `deploy:identity` |
| `webonone` | `webonone-v2/`, `desktop/` | `migrate:webonone`, `deploy:webonone` |
| `media` | `media/` | `migrate:media`, `deploy:media` |
| `email` | `email/` | `migrate:email`, `deploy:email` |
| `data` | `data/` | `migrate:data`, `deploy:data` |
| `sms` | `sms/` | `migrate:sms`, `deploy:sms` |
| `payment` | `payment/` | `migrate:payment`, `deploy:payment` |
| `website` | `website/` | `migrate:website`, `deploy:website` |
| `design` | `design/` | `migrate:design`, `deploy:design` |
| `ai` | `ai/` | `migrate:ai`, `deploy:ai` |
| `support` | `support/` | `migrate:support`, `deploy:support` |

**Force full (`mode=all`)** when any changed path is outside those trees, or matches: `packages/`, `ui-kit/`, root `package.json`, `package-lock.json`, `production.env.example`, `tooling/` (except pure docs if we choose — prefer full for any `tooling/` change affecting deploy), `.github/workflows/deploy-staging.yml`. Also force full when base SHA is missing / empty diff ambiguity / `force_all`.

`spec/`-only changes: no IIS service rebuild needed — migrate/deploy none, skip recycle wait or keep smoke optional; prefer **skip deploy steps** (log “no services”) rather than full deploy so feedback-fix docs alone do not burn a full cycle. Still run `env:apply` is unnecessary if nothing deploys — workflow should short-circuit after detection when list is empty and mode is selective.

## Implementation steps

1. **`tooling/deploy-services.json`** — Canonical map: service key → `{ roots: string[], migrateScript, deployScript, appPool, healthUrlKey or healthUrl }`. Align pool names with `iis-app-pools.json` and URLs with `smoke-health-urls.json` (or embed staging defaults and allow override).

2. **`tooling/detect-changed-services.mjs`**
   - Inputs: `--base`, `--head`, `--services` (comma list), `--force-all`, `--print` / `--github-output`.
   - `git diff --name-only base...head` (handle missing base → all).
   - Map paths → service keys; if any path forces full → `{ mode: 'all', services: [...] }`.
   - If no service paths and no force paths → `{ mode: 'none', services: [] }`.
   - Write `GITHUB_OUTPUT` keys: `mode`, `services` (comma-separated).

3. **`tooling/deploy-changed.mjs`**
   - Read detection result or CLI `--services` / `--all`.
   - Always: caller already ran `npm install` + `env:apply` in workflow.
   - For each service: `npm run migrate:{key}` then `npm run deploy:{key}` (deploy scripts already env:apply + build + stage).
   - `--all` → `npm run migrate:all` && `npm run deploy:all` (preserve today’s path).
   - Exit 0 on `none` with clear log.

4. **Smoke / recycle filters**
   - `recycle-iis-app-pools.ps1`: optional env `IIS_APP_POOLS` (comma-separated) overrides JSON list.
   - `smoke-production-health.ps1`: optional env already has `SMOKE_HEALTH_URLS`; workflow sets it from selected services when not overridden by repo variable for selective runs (if repo `SMOKE_HEALTH_URLS` is set for live hosts, filter that list by host/service mapping).

5. **`deploy-staging.yml`**
   - After sync: capture `BEFORE_SHA` from `github.event.before` (push) or previous HEAD; `AFTER` = HEAD.
   - `workflow_dispatch` inputs: `force_all` (boolean), `services` (string).
   - Step: detect → outputs.
   - Migrations + Build/stage: `node tooling/deploy-changed.mjs` with mode.
   - Recycle / smoke: pass filtered pools/URLs when selective; all when full; skip when none.

6. **Root `package.json`** — `"deploy:changed": "node tooling/deploy-changed.mjs"`.

7. **`tooling/CICD.md`** — Document selective rules, empty-diff skip, dispatch inputs, manual `npm run deploy:changed -- --services support`.

8. **Verify** — Run detector against recent commits; ensure ASCII-only in workflow PowerShell snippets.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product/tooling edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- `github.event.before` is `0000…` on new branch — treat as full deploy.
- Shared package change must full-deploy; selective package→consumer graph is out of MVP scope.
- `deploy:{service}` re-runs `env:apply` (idempotent); acceptable.
- Windows runner: keep workflow scripts ASCII-only (existing constraint).
