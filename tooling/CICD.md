# GitHub CI/CD (IIS staging deploy)

Automated **quality checks** on pull requests and **full IIS deploy** when **`deploy_staging`** is updated (including after a PR merge). Manual ops commands remain valid on the IIS server.

| Workflow | Trigger | Runner | Purpose |
|----------|---------|--------|---------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | PR → `deploy_staging`, push → `deploy_staging` | `ubuntu-latest` | `build:packages`, `type-check`, `lint`, workspace tests |
| [`.github/workflows/deploy-staging.yml`](../.github/workflows/deploy-staging.yml) | push → `deploy_staging`, `workflow_dispatch` | Self-hosted Windows | Selective or full migrate/deploy + health smoke |

**Warning:** `npm run env:apply` and `npm run deploy:all` overwrite every service’s `backend/.env` and `frontend/.env.production` from repo-root `production.env`. Run deploy only on the staging/IIS ops machine.

## One-time: self-hosted runner

On the Windows IIS server (same host as `production.env` and IIS sites):

1. GitHub → **Settings → Actions → Runners → New self-hosted runner** (Windows x64).
2. Install and register as a **service**. Add labels: `self-hosted`, `Windows`, `webonone-staging` (must match `deploy-staging.yml`). Default logon **NETWORK SERVICE** is fine for this workflow (it does not stop IIS app pools).
3. **Repository variable** (Settings → Secrets and variables → Actions → Variables):
   - `DEPLOY_REPO_ROOT` — clone path IIS uses (e.g. `C:\Projects\webonone_v2`). See [identity/deploy/IIS.md](../identity/deploy/IIS.md).
4. Create **`{DEPLOY_REPO_ROOT}\production.env`** from [`production.env.example`](../production.env.example). Never commit `production.env`.
5. Install **Git for Windows** and **Node.js 22 LTS**. The runner **Windows service** often has a stale PATH (Git works in an interactive shell but not in Actions). The workflow looks for `C:\Program Files\Git\cmd\git.exe` and reloads Machine/User PATH; **restart the runner service** after installing Git so other tools are visible too.
6. **Windows PowerShell 5.1** (built-in) is enough for deploy workflows - do **not** require PowerShell 7 (`pwsh`) unless you change workflow `shell` settings.
7. Grant the runner **Modify** on `{DEPLOY_REPO_ROOT}` if logon is NETWORK SERVICE (admin-owned clone). See below.
8. For a **private** repo, ensure the runner can `git pull` (runner’s credentials or deploy key).

### IIS app pools (not used by the workflow)

The workflow does **not** stop or start IIS. `NETWORK SERVICE` cannot read `inetsrv\config\redirection.config`. After a successful deploy, recycle app pools yourself (IIS Manager, or elevated `npm run recycle:iis`) so Node reloads `deploy/dist`.

### NETWORK SERVICE cannot write to the clone

`cannot open '.git/FETCH_HEAD': Permission denied` and `unable to unlink '.git/objects/...'` mean the runner cannot modify the clone. Fix this **once as Administrator** on the IIS server (the workflow cannot grant itself NTFS rights).

**Option A (fastest):** grant Modify to NETWORK SERVICE. Use the same path as `DEPLOY_REPO_ROOT` (if Git reported `C:/Projects`, that folder is the repo):

```powershell
# Elevated PowerShell. Replace C:\Projects with DEPLOY_REPO_ROOT if different.
icacls C:\Projects /grant "NT AUTHORITY\NETWORK SERVICE:(OI)(CI)M" /T
```

Confirm:

```powershell
icacls C:\Projects | Select-String 'NETWORK SERVICE'
```

You should see `(OI)(CI)(M)` or `(M)`. Then re-run **Deploy staging**.

**Option B (cleaner long-term):** run the runner as the Windows account that already owns the clone (the user who ran `git clone`). Services → GitHub Actions runner → Log on → that account → restart the service. That account still needs Modify on the clone and IIS recycle rights.

Optional repository variables:

- `SMOKE_HEALTH_URLS` — comma-separated full health URLs (overrides [`tooling/smoke-health-urls.json`](smoke-health-urls.json)).
- `SMOKE_HEALTH_RETRIES` — passed to the smoke script (default **3** attempts per URL with 15s delay).
- `IIS_APP_POOLS_JSON` — absolute path to a JSON file `{ "appPools": ["..."] }` for the pre-smoke recycle step (defaults to [`tooling/iis-app-pools.json`](iis-app-pools.json)). Use production pool names when `SMOKE_HEALTH_URLS` targets live hosts.

## Branch `deploy_staging`

1. Create the branch on GitHub (or locally and push): `deploy_staging`.
2. Ensure **`{DEPLOY_REPO_ROOT}`** on the server can fetch that branch (runner service account + git credentials).
3. Open PRs **into** `deploy_staging`. CI runs on the PR; after merge, **push** to `deploy_staging` starts **Deploy staging**.

## Branch protection (manual)

In GitHub → **Settings → Branches → Branch protection rules** for **`deploy_staging`**:

- Require a pull request before merging
- Require status checks to pass: select the **CI** job from `ci.yml`
- Restrict who can push to `deploy_staging` if your org policy allows

Deploy runs **after** merge via `push` to `deploy_staging`; it does not replace CI on the PR.

## What deploy does

In `DEPLOY_REPO_ROOT`:

1. Preflight: `production.env` must exist
2. `git fetch` / force-checkout `origin/deploy_staging` (tracked files reset; untracked `production.env` is kept)
3. Setup Node, then **Detect deploy targets** from git (`SYNC_BEFORE` → `SYNC_AFTER` on the IIS clone when they differ; otherwise `github.event.before` → new HEAD), unless `workflow_dispatch` overrides — **before** `npm install`. The **Deploy detect job summary** step lists mode, services, reason, and changed paths.
4. If mode is `none`: **Skip deploy** (no install, env apply, migrate, recycle, or smoke), then **Deploy summary**
5. If mode is not `none`: `npm install` (not `npm ci` - `npm ci` deletes `node_modules` and hits `EPERM` on DLLs still loaded by IIS Node)
6. `npm run env:apply`
7. **Selective:** `npm run migrate:<service>` + `npm run deploy:<service>` for each listed service (including when all eleven IIS keys are listed after `ui-kit/` changes). **Force-full (`mode=all`):** `migrate:all` then `deploy:<service>` per service — not `deploy:all` / `build:all`.
8. Try `npm run recycle:iis` (`IIS_APP_POOLS` set to changed pools when detect lists them; continues on failure if the runner cannot run `appcmd`)
9. Wait 30s, then smoke GET health URLs (filtered to changed services unless `mode=all` force-full)
10. **Deploy summary** always logs mode, services, and reason

If smoke still fails (e.g. **email** times out), recycle the **email** app pool in IIS Manager (or elevated `npm run recycle:iis` on the host that serves those URLs), then re-run [`tooling/smoke-production-health.ps1`](smoke-production-health.ps1).

Expect **tens of minutes** for a full deploy; selective deploys are typically much faster. Spec-only / non-IIS pushes skip install entirely.

**Desktop installer:** WebOnOne deploy uses `tooling/build-desktop-for-deploy.mjs` (not a hard `npm run build:desktop`). On self-hosted runners with low free RAM, electron-builder is skipped or soft-failed so IIS staging is not blocked by `WebAssembly.Memory(): could not allocate memory`. Publish a new `WebOnOne-Setup.exe` with `npm run build:desktop` on a host with enough memory (or set `SKIP_DESKTOP_BUILD=1` to skip intentionally).

### Deploy mode glossary

Detection config: [`tooling/deploy-services.json`](deploy-services.json). Scripts: `npm run deploy:detect`, `npm run deploy:changed`. CI runs `node --test tooling/detect-changed-services.test.mjs`.

**Before pushing feedback work**, run from repo root and copy results into `spec/{ticket}/development-summary.md` (see feedback-fix skill):

```bash
npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print
```

If `origin/deploy_staging` is missing locally, use `--base HEAD~1 --head HEAD` and note that in the summary.

| Mode | When | Behavior |
|------|------|----------|
| `selective` | One or more IIS services (or all eleven keys from shared libs like `ui-kit/`) | Per-service `migrate:<key>` + `deploy:<key>`; recycle/smoke filtered to listed services |
| `all` | `--force-all`, missing base SHA, or **force-full** paths (`package.json`, deploy tooling in `forceFullExactPaths`) | `migrate:all` + per-service `deploy:<key>` (no `deploy:all`) |
| `none` | No IIS-deployable paths (e.g. `spec/`, `mobile/`, `packages/mobile-ui/`, docs-only tooling) | Skip **npm install**, env apply, migrate, deploy, recycle, smoke |

**Shared libraries** (not blanket force-full for all of `packages/`):

| Path | IIS consumers |
|------|----------------|
| `ui-kit/`, `packages/theme/`, `packages/i18n/` | All IIS services → **`selective` with all service keys** (each site rebuilds its own bundle) |
| `packages/platform-nav/` | identity, webonone, data, design, ai, website, support |
| `packages/platform-embed/` | All except none (every IIS FE that embeds) |
| `packages/media-embed/` | identity, webonone, media, data, payment, design, support |
| `packages/store-kit/` | All IIS except website |
| `packages/mobile-ui/` | None (Expo only) → `mode=none` alone |

**Force-full** is limited to root `package.json` / `production.env.example` and deploy-critical tooling scripts listed in `forceFullExactPaths` (not every file under `tooling/` or `.github/workflows/`).

Service keys: `identity`, `webonone` (includes `desktop/`), `media`, `email`, `data`, `sms`, `payment`, `website`, `design`, `ai`, `support`.

### Manual workflow_dispatch

In GitHub → **Actions → Deploy staging → Run workflow**:

| Input | Effect |
|-------|--------|
| `force_all` | Full `migrate:all` + per-service `deploy:<key>` (detect `mode=all`) |
| `services` | Comma-separated keys (e.g. `support,data`); skips git auto-detect |

### Manual ops (selective)

```powershell
cd $env:DEPLOY_REPO_ROOT
git pull origin deploy_staging
npm install
npm run env:apply
# Auto from last commit:
npm run deploy:changed -- --base HEAD~1 --head HEAD
# Or explicit:
npm run deploy:changed -- --services support
# Or full:
npm run deploy:changed -- --all
npm run recycle:iis
powershell -ExecutionPolicy Bypass -File tooling/smoke-production-health.ps1
```

### Manual fallback (full, same as before)

```powershell
cd $env:DEPLOY_REPO_ROOT   # or your clone path
git pull origin deploy_staging
npm install
npm run env:apply
npm run migrate:all
npm run deploy:all
npm run recycle:iis
powershell -ExecutionPolicy Bypass -File tooling/smoke-production-health.ps1
```

Adjust app pool names in `tooling/iis-app-pools.json` if your IIS pool names differ from the defaults. Optional env: `IIS_APP_POOLS` (comma-separated) to recycle a subset.

## Local development

Developers keep per-service `frontend/.env` and `backend/.env` from each layer’s `.env.example`. CI and CD do not use `production.env` on developer machines.

## Security

- Self-hosted runners execute workflow code from the repo; limit who can merge to `deploy_staging`.
- Do not store the full `production.env` in GitHub Secrets unless you deliberately split secrets later.
