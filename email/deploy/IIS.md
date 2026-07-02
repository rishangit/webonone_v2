# Host Email on IIS — manual steps

Host **email.webonone.com** with IIS physical path set to **`email\deploy`**.

Run **`npm run deploy:email`** when you are ready to publish. That builds the app and stages output into `email\deploy\`. Normal development (`npm run dev:email`) and compile-only builds (`npm run build:email`) do **not** touch this folder.

```text
email\deploy\              ← IIS physical path (generated on deploy)
  web.config               HttpPlatformHandler → node dist/server.js
  dist\                    backend build (entry: dist/server.js)
  public\                  frontend build
  logs\                    Node stdout/stderr
  IIS.md                   this guide (not served by the app)
  stage-deploy.ps1         staging script (not served by the app)

email\backend\.env         ← runtime secrets (read directly by Node on IIS)
node_modules\              ← at repo root (npm install); Node resolves deps from here
```

Committed files in `email\deploy\`: **`web.config`**, **`stage-deploy.ps1`**, **`IIS.md`** only.

---

## Prerequisites

Identity must be deployed at **https://identity.webonone.com** with a platform-wide redirect allowlist:

- `identity\backend\.env` → `ALLOWED_REDIRECT_URIS=https://*.webonone.com`
- `identity\frontend\.env.production` → `VITE_ALLOWED_REDIRECT_URIS=https://*.webonone.com`

This allows Email login callbacks on `https://email.webonone.com/callback`. After updating Identity env, run `npm run deploy:identity` and recycle the Identity app pool.

---

## Step 1 — Install prerequisites

On the Windows Server:

1. **IIS** — Server Manager → Add Roles → Web Server (IIS)
2. **[HttpPlatformHandler](https://www.iis.net/downloads/microsoft/httpplatformhandler)** — x64 installer
3. **Node.js LTS** (22.x) — default install path `C:\Program Files\nodejs\`
4. **MySQL** — create database `webonone_email` and a user with access to it

---

## Step 2 — DNS and certificate

1. Add DNS record: **email.webonone.com** → server IP (`A` or `CNAME`)
2. In IIS, have a TLS certificate that covers **email.webonone.com** (or `*.webonone.com`)

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
copy email\backend\.env.example email\backend\.env
```

Edit `email\backend\.env` — set `DB_*`, `JWT_SECRET` (must match `identity\backend\.env`), `EMAIL_SERVICE_API_KEY` (shared with Identity and WebOnOne backends), and production SMTP values. See commented production block in `email\backend\.env.example`.

For IIS, HttpPlatformHandler sets `PORT` at runtime — a `PORT` line in this file is ignored when `IIS_NODE_HOSTED=1`.

### Frontend (build-time only)

```powershell
copy email\frontend\.env.example email\frontend\.env.production
```

Edit `email\frontend\.env.production` — production values:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `/api/v1` |
| `VITE_IDENTITY_ORIGIN` | `https://identity.webonone.com` |
| `VITE_IDENTITY_API_BASE_URL` | `https://identity.webonone.com/api/v1` |
| `VITE_WEBONONE_ORIGIN` | `https://app.webonone.com` |
| `VITE_WEBONONE_API_BASE_URL` | `https://app.webonone.com/api/v1` |
| `VITE_ALLOWED_PARENT_ORIGINS` | `https://app.webonone.com,https://identity.webonone.com` |

Vite embeds these values during deploy build. Changes require redeploy.

---

## Step 5 — Run database migrations

```powershell
cd C:\Projects\webonone_v2
npm run migrate -w email-root
```

---

## Step 6 — Deploy to IIS folder

```powershell
cd C:\Projects\webonone_v2
npm run deploy:email
```

This will:

1. Build shared packages (`@webonone/theme`, `@webonone/ui-kit`), frontend (using `frontend\.env.production`), and backend
2. Copy output into `email\deploy\public\` and `email\deploy\dist\`

Dependencies are **not** copied into `deploy\`. Node resolves packages from the repo root `node_modules\`.

To re-stage without rebuilding (after you already ran a build):

```powershell
cd C:\Projects\webonone_v2\email
npm run stage:deploy
```

To remove generated output during development (keeps only `web.config`, `stage-deploy.ps1`, `IIS.md`):

```powershell
cd C:\Projects\webonone_v2\email
npm run clean:deploy
```

---

## Step 7 — Create the IIS website

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. **Site name:** `Email`
4. **Physical path:** `C:\Projects\webonone_v2\email\deploy`
5. **Binding:** Type `https`, Host name `email.webonone.com`, select your certificate
6. Click **OK**

### Application pool

1. Select the **Email** site → **Basic Settings** → note the app pool name
2. Open **Application Pools** → select that pool
3. **.NET CLR version:** **No Managed Code**

---

## Step 8 — Set folder permissions

Grant the app pool identity **Read & execute** on `email\deploy` (including subfolders), **Read** on `email\backend\.env`, and **Read & execute** on the repo root `node_modules\`.

Typical identity: `IIS AppPool\Email` (if pool name is `Email`).

The app pool also needs **Write** on `email\deploy\logs`.

---

## Step 9 — Verify

| URL | Expected |
|-----|----------|
| `https://email.webonone.com/api/v1/health` | `{"status":"ok","service":"email"}` |
| `https://email.webonone.com/` | Email dashboard UI loads |
| Login via platform nav | Redirects to Identity, returns to Email |

If the site fails, check `email\deploy\logs\` for Node errors.

---

## Redeploy after code changes

```powershell
cd C:\Projects\webonone_v2
git pull
npm run deploy:email
```

Recycle the IIS app pool or restart the site.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502.3 / site won't start | Install HttpPlatformHandler; confirm Node at `C:\Program Files\nodejs\node.exe` (or edit `processPath` in `web.config`) |
| Page spins / never loads (0 bytes, timeout) | **Do not hardcode `PORT=4004` in `web.config`.** Use `<environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />` |
| 500 / Node crash | Check `email\deploy\logs\` and `email\backend\.env` (DB credentials, `JWT_SECRET`, SMTP) |
| SPA 404 | Confirm `email\deploy\public\index.html` exists — run `npm run deploy:email` |
| API 404 from SPA | Frontend must be built with `VITE_API_BASE_URL=/api/v1` in `frontend\.env.production` |
| Login callback rejected | Identity `ALLOWED_REDIRECT_URIS` must include `https://*.webonone.com`; redeploy Identity |
| Internal send fails from Identity/WebOnOne | `EMAIL_SERVICE_API_KEY` must match across all three backends |
| DB errors | Run migrations; verify `DB_*` in `backend\.env` |

---

## Files in this folder

| File | Purpose |
|------|---------|
| [`web.config`](web.config) | IIS HttpPlatformHandler — runs `node dist/server.js` |
| [`stage-deploy.ps1`](stage-deploy.ps1) | Copies build output here (run via `npm run deploy -w email-root`) |
| [`IIS.md`](IIS.md) | This deployment guide |

Env templates live in **`email\backend\.env.example`** and **`email\frontend\.env.example`**.
