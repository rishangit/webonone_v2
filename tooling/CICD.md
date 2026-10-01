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
3. **Log on the runner service as a local Administrator** (not the default **NETWORK SERVICE**). Stopping IIS app pools and reading `inetsrv\config\redirection.config` require admin. Services → GitHub Actions runner → **Log on** → this account (the same admin that cloned `C:\Projects`) → restart the service.
4. **Repository variable** (Settings → Secrets and variables → Actions → Variables):
   - `DEPLOY_REPO_ROOT` — clone path IIS uses (e.g. `C:\Projects\webonone_v2`). See [identity/deploy/IIS.md](../identity/deploy/IIS.md).
5. Create **`{DEPLOY_REPO_ROOT}\production.env`** from [`production.env.example`](../production.env.example). Never commit `production.env`.
6. Install **Git for Windows** and **Node.js 22 LTS**. The runner **Windows service** often has a stale PATH (Git works in an interactive shell but not in Actions). The workflow looks for `C:\Program Files\Git\cmd\git.exe` and reloads Machine/User PATH; **restart the runner service** after installing Git so other tools are visible too.
7. **Windows PowerShell 5.1** (built-in) is enough for deploy workflows - do **not** require PowerShell 7 (`pwsh`) unless you change workflow `shell` settings.
8. That admin account already owns the clone in typical setups. If you keep **NETWORK SERVICE**, grant it **Modify** on `{DEPLOY_REPO_ROOT}` (see below) — but IIS stop/start will still fail until the runner is an Administrator.
9. For a **private** repo, ensure the runner can `git pull` (runner’s credentials or deploy key).

### Runner account and IIS

Default runner logon is **NETWORK SERVICE**. That account cannot read `C:\Windows\System32\inetsrv\config\redirection.config`, so `appcmd` / WebAdministration fail with `insufficient permissions`. Granting Modify on `C:\Projects` does **not** fix IIS.

**Required:** Services → runner → Log on → local **Administrators** account → restart. Then re-run **Deploy staging**.

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
3. Stop IIS app pools (`npm run iis:stop`) so Node releases `node_modules` native DLLs (e.g. sharp `libvips-42.dll`). Windows cannot unlink a loaded DLL (`npm ci` `EPERM`).
4. `npm ci`
5. `npm run env:apply` (write each service `backend/.env` before migrate)
6. `npm run migrate:all`
7. `npm run deploy:all` (`env:apply`, `build:all`, stage all `{service}/deploy/`)
8. Start IIS app pools (`npm run iis:start`) even if a later step failed, so sites are not left stopped
9. Smoke GET each `/api/v1/health` URL

Expect **tens of minutes** for a full `deploy:all`.

## Manual fallback (same as before)

```powershell
cd $env:DEPLOY_REPO_ROOT   # or your clone path
git pull origin deploy_staging
npm run iis:stop
npm run env:apply
npm run migrate:all
npm run deploy:all
npm run iis:start
powershell -ExecutionPolicy Bypass -File tooling/smoke-production-health.ps1
```

Adjust app pool names in `tooling/iis-app-pools.json` if your IIS pool names differ from the defaults.

## Local development

Developers keep per-service `frontend/.env` and `backend/.env` from each layer’s `.env.example`. CI and CD do not use `production.env` on developer machines.

## Security

- Self-hosted runners execute workflow code from the repo; limit who can merge to `deploy_staging`.
- Do not store the full `production.env` in GitHub Secrets unless you deliberately split secrets later.
