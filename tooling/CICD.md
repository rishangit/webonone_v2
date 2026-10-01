# GitHub CI/CD (IIS staging deploy)

Automated **quality checks** on pull requests and **full IIS deploy** when **`deploy_staging`** is updated (including after a PR merge). Manual ops commands remain valid on the IIS server.

| Workflow | Trigger | Runner | Purpose |
|----------|---------|--------|---------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | PR → `deploy_staging`, push → `deploy_staging` | `ubuntu-latest` | `build:packages`, `type-check`, `lint`, workspace tests |
| [`.github/workflows/deploy-staging.yml`](../.github/workflows/deploy-staging.yml) | push → `deploy_staging`, `workflow_dispatch` | Self-hosted Windows | `migrate:all`, `deploy:all`, IIS recycle, health smoke |

**Warning:** `npm run env:apply` and `npm run deploy:all` overwrite every service’s `backend/.env` and `frontend/.env.production` from repo-root `production.env`. Run deploy only on the staging/IIS ops machine.

## One-time: self-hosted runner

On the Windows IIS server (same host as `production.env` and IIS sites):

1. GitHub → **Settings → Actions → Runners → New self-hosted runner** (Windows x64).
2. Install and register as a **service**. Add labels: `self-hosted`, `Windows`, `webonone-staging` (must match `deploy-staging.yml`).
3. **Repository variable** (Settings → Secrets and variables → Actions → Variables):
   - `DEPLOY_REPO_ROOT` — clone path IIS uses (e.g. `C:\Projects\webonone_v2`). See [identity/deploy/IIS.md](../identity/deploy/IIS.md).
4. Create **`{DEPLOY_REPO_ROOT}\production.env`** from [`production.env.example`](../production.env.example). Never commit `production.env`.
5. Install **Git for Windows** and **Node.js 22 LTS**. The runner **Windows service** often has a stale PATH (Git works in an interactive shell but not in Actions). The workflow looks for `C:\Program Files\Git\cmd\git.exe` and reloads Machine/User PATH; **restart the runner service** after installing Git so other tools are visible too.
6. **Windows PowerShell 5.1** (built-in) is enough for deploy workflows - do **not** require PowerShell 7 (`pwsh`) unless you change workflow `shell` settings.
7. Grant the runner service account:
   - Read/execute on the repo and root `node_modules`
   - Read on `production.env` and generated `backend/.env` files
   - Permission to **recycle IIS app pools** (admin or delegated)
8. For a **private** repo, ensure the runner can `git pull` (runner’s credentials or deploy key).
9. The default runner service account is **NETWORK SERVICE**. Folders created by an admin (e.g. `C:\Projects`) will trigger Git `dubious ownership`. The workflow sets `safe.directory` in **that account’s** global gitconfig (`C:\Windows\ServiceProfiles\NetworkService\.gitconfig`). Do not run `git config --global` in an admin PowerShell expecting it to fix Actions.

Optional repository variable:

- `SMOKE_HEALTH_URLS` — comma-separated full health URLs (overrides [`tooling/smoke-health-urls.json`](smoke-health-urls.json)).

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
3. `npm ci`
4. `npm run env:apply` (write each service `backend/.env` before migrate)
5. `npm run migrate:all`
6. `npm run deploy:all` (`env:apply`, `build:all`, stage all `{service}/deploy/`)
7. `npm run recycle:iis` - restart app pools listed in [`iis-app-pools.json`](iis-app-pools.json)
8. Smoke GET each `/api/v1/health` URL

Expect **tens of minutes** for a full `deploy:all`.

## Manual fallback (same as before)

```powershell
cd $env:DEPLOY_REPO_ROOT   # or your clone path
git pull origin deploy_staging
npm run env:apply
npm run migrate:all
npm run deploy:all
npm run recycle:iis
powershell -ExecutionPolicy Bypass -File tooling/smoke-production-health.ps1
```

Adjust app pool names in `tooling/iis-app-pools.json` if your IIS pool names differ from the defaults.

## Local development

Developers keep per-service `frontend/.env` and `backend/.env` from each layer’s `.env.example`. CI and CD do not use `production.env` on developer machines.

## Security

- Self-hosted runners execute workflow code from the repo; limit who can merge to `deploy_staging`.
- Do not store the full `production.env` in GitHub Secrets unless you deliberately split secrets later.
