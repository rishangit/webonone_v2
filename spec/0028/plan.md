# Plan — Feedback 0028

## Approach

Keep the 0012 selective deploy machinery. Replace blanket `packages/` / `ui-kit/` / `tooling/` force-full rules with a **shared library → IIS consumer** map plus ignore prefixes. Reorder `deploy-staging.yml` so detection runs before `npm install` and `mode=none` skips install. Add a final always-run summary step.

## Shared library map (IIS consumers)

Derived from each service root `build` script (who rebuilds the package on deploy):

| Library roots | Affects |
|---------------|---------|
| `ui-kit/` | all IIS services → resolve to `mode=all` |
| `packages/theme/` | all → `mode=all` |
| `packages/i18n/` | all → `mode=all` |
| `packages/platform-nav/` | identity, webonone, data, design, ai, website, support |
| `packages/platform-embed/` | identity, webonone, media, email, data, sms, payment, website, design, ai, support |
| `packages/media-embed/` | identity, webonone, media, data, payment, design, support |
| `packages/store-kit/` | identity, webonone, media, email, data, sms, payment, design, ai, support |
| `packages/mobile-ui/` | _(empty — Expo only)_ |

Ignore-only (never select a service): `spec/`, `.cursor/`, `mobile/`, `AGENTS.md`, agent transcripts paths if any under repo, `tooling/CICD.md`, `tooling/support-feedback-mcp/`.

Force-full exact/prefix (narrow): root `package.json` / lockfile / `production.env.example` / deploy workflow; deploy-critical tooling scripts (`detect-changed-services.mjs`, `deploy-changed.mjs`, `deploy-services.json`, `apply-production-env.mjs`, `stage-iis-deploy.mjs`, recycle/smoke scripts + JSON).

## Detection algorithm

1. Force-full path match → `{ mode: 'all', services: serviceOrder }`.
2. Else union: service-root hits + shared-library `affects`.
3. Ignore-prefix hits add nothing.
4. Unknown path under `packages/` not listed → force-full (safe).
5. If selected empty → `mode=none`.
6. If selected equals full `serviceOrder` → `mode=all` (use `deploy:all` once).
7. Else → `mode=selective`.

## Implementation steps

1. **`tooling/deploy-services.json`** — Add `sharedLibraries`, `ignorePathPrefixes`, replace broad `forceFullPathPrefixes` with narrowed list / exact tooling files.
2. **`tooling/detect-changed-services.mjs`** — Implement algorithm above; keep CLI flags.
3. **`.github/workflows/deploy-staging.yml`** — Move Detect immediately after Setup Node (before Install); gate Install / Apply / Migrate on `mode != none`; keep Skip for `none`; add always-run **Deploy summary** at end (ASCII-only PowerShell).
4. **`tooling/CICD.md`** — Document library map, early skip, summary step.
5. **Verify** — Synthetic `--files` cases from acceptance criteria; `node --check`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before tooling edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- First push of this ticket touches `tooling/detect-*` / `deploy-services.json` → force-full once (expected).
- ui-kit / theme / i18n changes still full-deploy by design (every IIS FE depends on them).
- `deploy:{service}` still rebuilds its chained packages; optimizing warm `dist/` is out of scope.
