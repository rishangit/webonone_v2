# Host WebOnOne v2 on IIS — manual steps

Host **app.webonone.com** with IIS physical path set to **`webonone-v2\deploy`**.

Run **`npm run deploy:webonone`** when you are ready to publish. That builds the app and stages output into `webonone-v2\deploy\`. Normal development (`npm run dev:webonone`) and compile-only builds (`npm run build:webonone`) do **not** touch this folder.

```text
webonone-v2\deploy\          ← IIS physical path (generated on deploy)
  web.config                 HttpPlatformHandler → node dist/server.js
  dist\                      backend build (entry: dist/server.js)
  public\                    frontend build
  logs\                      Node stdout/stderr
  IIS.md                     this guide (not served by the app)
  stage-deploy.ps1           staging script (not served by the app)

webonone-v2\backend\.env     ← runtime secrets (read directly by Node on IIS)
node_modules\                ← at repo root (npm install); Node resolves deps from here
```

Committed files in `webonone-v2\deploy\`: **`web.config`**, **`stage-deploy.ps1`**, **`IIS.md`** only.

---

## Prerequisites

Identity must be deployed at **https://identity.webonone.com** with a platform-wide redirect allowlist:

- `identity\backend\.env` → `ALLOWED_REDIRECT_URIS=https://*.webonone.com`
- `identity\frontend\.env.production` → `VITE_ALLOWED_REDIRECT_URIS=https://*.webonone.com`

This allows any `https://` microservice subdomain (e.g. `app`, `billing`) without listing each callback URL. After updating Identity env, run `npm run deploy:identity` and recycle the Identity app pool.

---

## Step 1 — Install prerequisites

On the Windows Server:

1. **IIS** — Server Manager → Add Roles → Web Server (IIS)
2. **[HttpPlatformHandler](https://www.iis.net/downloads/microsoft/httpplatformhandler)** — x64 installer
3. **Node.js LTS** (22.x) — default install path `C:\Program Files\nodejs\`
4. **MySQL** — create database `webonon_v2` and a user with access to it

---

## Step 2 — DNS and certificate

1. Add DNS record: **app.webonone.com** → server IP (`A` or `CNAME`)
2. In IIS, have a TLS certificate that covers **app.webonone.com** (or `*.webonone.com`)

---

## Step 3 — Get the code on the server

```powershell
git clone <repo-url> C:\Projects\webonone_v2
cd C:\Projects\webonone_v2
npm install
```

---

## Step 4 — Configure environment

Use the same env files as local development — no separate deploy templates.

### Backend (migrations + IIS runtime)

```powershell
copy webonone-v2\backend\.env.example webonone-v2\backend\.env
```

Edit `webonone-v2\backend\.env` — set `DB_*` and `JWT_SECRET` (must match `identity\backend\.env`).

For IIS, HttpPlatformHandler sets `PORT` at runtime — a `PORT` line in this file is ignored when `IIS_NODE_HOSTED=1`.

### Frontend (build-time only)

```powershell
copy webonone-v2\frontend\.env.example webonone-v2\frontend\.env.production
```

Edit `webonone-v2\frontend\.env.production` — production values:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `/api/v1` |
| `VITE_IDENTITY_ORIGIN` | `https://identity.webonone.com` |
| `VITE_IDENTITY_API_BASE_URL` | `https://identity.webonone.com/api/v1` |

| Variable | Purpose |
|----------|---------|
| `VITE_IDENTITY_ORIGIN` | Login redirect and profile page (Identity SPA) |
| `VITE_IDENTITY_API_BASE_URL` | Identity API calls (`/auth/exchange`, `/auth/code`) |

Locally, Identity FE (3001) and BE (4001) run on different ports, so both URLs must be set. On IIS, Identity serves SPA and API from the same host — use the same domain with `/api/v1` for the API base.

Login callback (`/callback`) is derived at runtime from `window.location.origin`.

Vite embeds these values during deploy build. Changes require redeploy.

---

## Step 5 — Run database migrations

```powershell
cd C:\Projects\webonone_v2
npm run migrate -w webonone-v2-root
```

---

## Step 6 — Deploy to IIS folder

```powershell
cd C:\Projects\webonone_v2
npm run deploy:webonone
```

This will:

1. Build shared packages (`@webonone/platform-nav`, `@webonone/ui-kit`), frontend (using `frontend\.env.production`), and backend
2. Copy output into `webonone-v2\deploy\public\` and `webonone-v2\deploy\dist\`

Dependencies are **not** copied into `deploy\`. Node resolves packages from the repo root `node_modules\`.

To re-stage without rebuilding (after you already ran a build):

```powershell
cd C:\Projects\webonone_v2\webonone-v2
npm run stage:deploy
```

To remove generated output during development (keeps only `web.config`, `stage-deploy.ps1`, `IIS.md`):

```powershell
cd C:\Projects\webonone_v2\webonone-v2
npm run clean:deploy
```

---

## Step 7 — Create the IIS website

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. **Site name:** `WebOnOne`
4. **Physical path:** `C:\Projects\webonone_v2\webonone-v2\deploy`
5. **Binding:** Type `https`, Host name `app.webonone.com`, select your certificate
6. Click **OK**

### Application pool

1. Select the **WebOnOne** site → **Basic Settings** → note the app pool name
2. Open **Application Pools** → select that pool
3. **.NET CLR version:** **No Managed Code**

---

## Step 8 — Set folder permissions

Grant the app pool identity **Read & execute** on `webonone-v2\deploy` (including subfolders), **Read** on `webonone-v2\backend\.env`, and **Read & execute** on the repo root `node_modules\`.

Typical identity: `IIS AppPool\WebOnOne` (if pool name is `WebOnOne`).

The app pool also needs **Write** on `webonone-v2\deploy\logs`.

---

## Step 9 — Verify

| URL | Expected |
|-----|----------|
| `https://app.webonone.com/api/v1/health` | `{"status":"ok","service":"webonone-v2"}` |
| `https://app.webonone.com/` | SPA home loads |
| `https://app.webonone.com/login` | Redirects to Identity login |
| Login → callback | Returns to `https://app.webonone.com/callback`, JWT stored, home loads |

If the site fails, check `webonone-v2\deploy\logs\` for Node errors.

---

## Redeploy after code changes

```powershell
cd C:\Projects\webonone_v2
git pull
npm run deploy:webonone
```

Recycle the IIS app pool or restart the site.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502.3 / site won't start | Install HttpPlatformHandler; confirm Node at `C:\Program Files\nodejs\node.exe` (or edit `processPath` in `web.config`) |
| Page spins / never loads (0 bytes, timeout) | **Do not hardcode `PORT=4000` in `web.config`.** Use `<environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />` |
| 500 / Node crash | Check `webonone-v2\deploy\logs\` and `webonone-v2\backend\.env` (DB credentials, `JWT_SECRET`) |
| SPA 404 | Confirm `webonone-v2\deploy\public\index.html` exists — run `npm run deploy:webonone` |
| API 404 from SPA | Frontend must be built with `VITE_API_BASE_URL=/api/v1` in `frontend\.env.production` |
| Login callback rejected | Identity `ALLOWED_REDIRECT_URIS` must include `https://*.webonone.com` (or match the consumer origin); redeploy Identity |
| DB errors | Run migrations; verify `DB_*` in `backend\.env` |

---

## Files in this folder

| File | Purpose |
|------|---------|
| [`web.config`](web.config) | IIS HttpPlatformHandler — runs `node dist/server.js` |
| [`stage-deploy.ps1`](stage-deploy.ps1) | Copies build output here (run via `npm run deploy -w webonone-v2-root`) |
| [`IIS.md`](IIS.md) | This deployment guide |

Env templates live in **`webonone-v2\backend\.env.example`** and **`webonone-v2\frontend\.env.example`**.
