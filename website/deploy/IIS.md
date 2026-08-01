# Host Website on IIS — manual steps

Host **www.webonone.com** with IIS physical path set to **`website\deploy`**.

Run **`npm run deploy:website`** when you are ready to publish. That builds the app and stages output into `website\deploy\`. Normal development (`npm run dev:website`) and compile-only builds (`npm run build:website`) do **not** touch this folder.

```text
website\deploy\              ← IIS physical path (generated on deploy)
  web.config               HttpPlatformHandler → node dist/server.js
  dist\                    backend build (entry: dist/server.js)
  public\                  frontend build
  logs\                    Node stdout/stderr
  IIS.md                   this guide (not served by the app)
  stage-deploy.ps1         staging script (not served by the app)

website\backend\.env         ← runtime secrets (read directly by Node on IIS)
node_modules\              ← at repo root (npm install); Node resolves deps from here
```

Committed files in `website\deploy\`: **`web.config`**, **`stage-deploy.ps1`**, **`IIS.md`** only.

---

## Prerequisites

WebOnOne must be deployed at **https://app.webonone.com** so catalog search can call the internal API. Set `WEBONONE_SERVICE_API_KEY` and `ORIGIN_WEBONONE` once in root `production.env` (apply writes matching values into both WebOnOne and Website backends). Then `npm run deploy:webonone` / `npm run deploy:website` and recycle the app pools.

---

## Step 1 — Install prerequisites

On the Windows Server:

1. **IIS** — Server Manager → Add Roles → Web Server (IIS)
2. **[HttpPlatformHandler](https://www.iis.net/downloads/microsoft/httpplatformhandler)** — x64 installer
3. **Node.js LTS** (22.x) — default install path `C:\Program Files\nodejs\`
4. **MySQL** — create database `webonone_web` and a user with access to it

---

## Step 2 — DNS and certificate

1. Add DNS record: **www.webonone.com** → server IP (`A` or `CNAME`)
2. In IIS, have a TLS certificate that covers **www.webonone.com** (or `*.webonone.com` / apex as needed)

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

Fill shared secrets (`JWT_SECRET`, service API keys, `DB_*`), origins (`ORIGIN_*`), and service-specific keys. See `production.env.example` comments.

`npm run deploy:website` runs `npm run env:apply`, which writes each service's `backend\.env` and `frontend\.env.production`. Do not hand-copy per-service `.env.example` for production.

For IIS, HttpPlatformHandler sets `PORT` at runtime — a `PORT` line in generated backend files is ignored when `IIS_NODE_HOSTED=1`.

**Warning:** Keep `production.env` only on the ops/IIS machine. Running `env:apply` overwrites every service's `backend\.env`.

---

## Step 5 — Run database migrations

```powershell
cd C:\Projects\webonone_v2
npm run migrate -w website-root
```

---

## Step 6 — Deploy to IIS folder

```powershell
cd C:\Projects\webonone_v2
npm run deploy:website
```

This will:

1. Run `env:apply` (expand root `production.env` into each service’s env files)
2. Build shared packages (`@webonone/theme`, `@webonone/ui-kit`), frontend (using `frontend\.env.production`), and backend
3. Copy output into `website\deploy\public\` and `website\deploy\dist\`

Dependencies are **not** copied into `deploy\`. Node resolves packages from the repo root `node_modules\`.

To re-stage without rebuilding (after you already ran a build):

```powershell
cd C:\Projects\webonone_v2\website
npm run stage:deploy
```

To remove generated output during development (keeps only `web.config`, `stage-deploy.ps1`, `IIS.md`):

```powershell
cd C:\Projects\webonone_v2\website
npm run clean:deploy
```

---

## Step 7 — Create the IIS website

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. **Site name:** `Website`
4. **Physical path:** `C:\Projects\webonone_v2\website\deploy`
5. **Binding:** Type `https`, Host name `www.webonone.com`, select your certificate
6. Click **OK**

### Application pool

1. Select the **Website** site → **Basic Settings** → note the app pool name
2. Open **Application Pools** → select that pool
3. **.NET CLR version:** **No Managed Code**

---

## Step 8 — Set folder permissions

Grant the app pool identity **Read & execute** on `website\deploy` (including subfolders), **Read** on `website\backend\.env`, and **Read & execute** on the repo root `node_modules\`.

Typical identity: `IIS AppPool\Website` (if pool name is `Website`).

The app pool also needs **Write** on `website\deploy\logs`.

---

## Step 9 — Verify

| URL | Expected |
|-----|----------|
| `https://www.webonone.com/api/v1/health` | `{"status":"ok","service":"website",...}` |
| `https://www.webonone.com/` | Public marketing UI loads |
| Catalog search | Returns results when WebOnOne is up and keys match |

If the site fails, check `website\deploy\logs\` for Node errors.

---

## Redeploy after code changes

```powershell
cd C:\Projects\webonone_v2
git pull
npm run deploy:website
```

Recycle the IIS app pool or restart the site.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502.3 / site won't start | Install HttpPlatformHandler; confirm Node at `C:\Program Files\nodejs\node.exe` (or edit `processPath` in `web.config`) |
| Page spins / never loads (0 bytes, timeout) | **Do not hardcode `PORT=4018` in `web.config`.** Use `<environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />` |
| 500 / Node crash | Check `website\deploy\logs\` and `website\backend\.env` (DB credentials, WebOnOne key) |
| SPA 404 | Confirm `website\deploy\public\index.html` exists — run `npm run deploy:website` |
| API 404 from SPA | Frontend must be built with `VITE_API_BASE_URL=/api/v1` in `frontend\.env.production` |
| Catalog search fails | `WEBONONE_SERVICE_API_KEY` must match WebOnOne; `WEBONONE_API_BASE_URL=https://app.webonone.com` |
| DB errors | Run migrations; verify `DB_*` in `backend\.env` |

---

## Files in this folder

| File | Purpose |
|------|---------|
| [`web.config`](web.config) | IIS HttpPlatformHandler — runs `node dist/server.js` |
| [`stage-deploy.ps1`](stage-deploy.ps1) | Copies build output here (run via `npm run deploy -w website-root`) |
| [`IIS.md`](IIS.md) | This deployment guide |

Env templates live in **`website\backend\.env.example`** and **`website\frontend\.env.example`**.
