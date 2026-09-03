# Host Support on IIS — manual steps

Host **support.webonone.com** with IIS physical path set to **`support\deploy`**.

Run **`npm run deploy:support`** when you are ready to publish. That builds the app and stages output into `support\deploy\`. Normal development (`npm run dev:support`) and compile-only builds (`npm run build:support`) do **not** touch this folder.

```text
support\deploy\              ← IIS physical path (generated on deploy)
  web.config               HttpPlatformHandler → node dist/server.js
  dist\                    backend build (entry: dist/server.js)
  public\                  frontend build
  logs\                    Node stdout/stderr
  IIS.md                   this guide (not served by the app)
  stage-deploy.ps1         staging script (not served by the app)

support\backend\.env         ← runtime secrets (read directly by Node on IIS)
node_modules\              ← at repo root (npm install); Node resolves deps from here
```

Committed files in `support\deploy\`: **`web.config`**, **`stage-deploy.ps1`**, **`IIS.md`** only.

---

## Prerequisites

This is a **public help site**. It does not require Identity login. Website (`https://webonone.com`) and WebOnOne (`https://app.webonone.com`) should already be deployed so header links work.

---

## Step 1 — Install prerequisites

On the Windows Server:

1. **IIS** — Server Manager → Add Roles → Web Server (IIS)
2. **[HttpPlatformHandler](https://www.iis.net/downloads/microsoft/httpplatformhandler)** — x64 installer
3. **Node.js LTS** (22.x) — default install path `C:\Program Files\nodejs\`
4. **MySQL** — create database `webonone_support` and a user with access to it
5. **URL Rewrite** — used for HTTP → HTTPS

---

## Step 2 — DNS and certificate

1. Add DNS record: **support.webonone.com** → server IP (`A` or `CNAME`)
2. In IIS, have a TLS certificate that covers **support.webonone.com** (or `*.webonone.com`)

---

## Step 3 — Get the code on the server

```powershell
git clone <repo-url> C:\Projects\webonone_v2
cd C:\Projects\webonone_v2
npm install
```

---

## Step 4 — Configure environment

Edit **one** file at the repo root (gitignored):

```powershell
copy production.env.example production.env
```

Set `ORIGIN_SUPPORT=https://support.webonone.com` and `SUPPORT_DB_NAME=webonone_support`.

`npm run deploy:support` runs `npm run env:apply`, which writes each service's `backend\.env` and `frontend\.env.production`. Do not hand-copy per-service `.env.example` for production.

For IIS, HttpPlatformHandler sets `PORT` at runtime — a `PORT` line in generated backend files is ignored when `IIS_NODE_HOSTED=1`.

**Warning:** Keep `production.env` only on the ops/IIS machine. Running `env:apply` overwrites every service's `backend\.env`.

---

## Step 5 — Run database migrations

```powershell
cd C:\Projects\webonone_v2
npm run migrate -w support-root
```

---

## Step 6 — Deploy to IIS folder

```powershell
cd C:\Projects\webonone_v2
npm run deploy:support
```

This will:

1. Run `env:apply` (expand root `production.env` into each service’s env files)
2. Build shared packages, frontend (using `frontend\.env.production`), and backend
3. Copy output into `support\deploy\public\` and `support\deploy\dist\`

Dependencies are **not** copied into `deploy\`. Node resolves packages from the repo root `node_modules\`.

To re-stage without rebuilding (after you already ran a build):

```powershell
cd C:\Projects\webonone_v2\support
npm run stage:deploy
```

To remove generated output during development (keeps only `web.config`, `stage-deploy.ps1`, `IIS.md`):

```powershell
cd C:\Projects\webonone_v2\support
npm run clean:deploy
```

---

## Step 7 — Create the IIS website

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. **Site name:** `Support`
4. **Physical path:** `C:\Projects\webonone_v2\support\deploy`
5. **Binding:** Type `https`, Host name `support.webonone.com`, select your certificate
6. Also add an **http** binding for `support.webonone.com` so ACME and the HTTPS redirect work
7. Click **OK**

### Application pool

1. Select the **Support** site → **Basic Settings** → note the app pool name
2. Open **Application Pools** → select that pool
3. **.NET CLR version:** **No Managed Code**

---

## Step 8 — Set folder permissions

Grant the app pool identity **Read & execute** on `support\deploy` (including subfolders), **Read** on `support\backend\.env`, and **Read & execute** on the repo root `node_modules\`.

Typical identity: `IIS AppPool\Support` (if pool name is `Support`).

The app pool also needs **Write** on `support\deploy\logs`.

---

## Step 9 — Verify

| URL | Expected |
|-----|----------|
| `https://support.webonone.com/api/v1/health` | `{"status":"ok","service":"support",...}` |
| `https://support.webonone.com/` | Help home loads |
| `http://support.webonone.com/` | **301** → `https://support.webonone.com/` |

If the site fails, check `support\deploy\logs\` for Node errors.

---

## Redeploy after code changes

```powershell
cd C:\Projects\webonone_v2
git pull
npm run deploy:support
```

Recycle the IIS app pool or restart the site.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502.3 / site won't start | Install HttpPlatformHandler; confirm Node at `C:\Program Files\nodejs\node.exe` (or edit `processPath` in `web.config`) |
| Page spins / never loads (0 bytes, timeout) | **Do not hardcode `PORT` in `web.config`.** Use `<environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />` |
| 500 / Node crash | Check `support\deploy\logs\` and `support\backend\.env` (DB credentials) |
| SPA 404 | Confirm `support\deploy\public\index.html` exists — run `npm run deploy:support` |
| API 404 from SPA | Frontend must be built with `VITE_API_BASE_URL=/api/v1` in `frontend\.env.production` |
| DB errors | Run migrations; verify `DB_*` in `backend\.env` |

---

## Files in this folder

| File | Purpose |
|------|---------|
| [`web.config`](web.config) | IIS HttpPlatformHandler — runs `node dist/server.js` |
| [`stage-deploy.ps1`](stage-deploy.ps1) | Copies build output here (run via `npm run deploy -w support-root`) |
| [`IIS.md`](IIS.md) | This deployment guide |

Production secrets/origins: repo-root **`production.env`**. Local-dev templates: **`support\backend\.env.example`** and **`support\frontend\.env.example`**.
