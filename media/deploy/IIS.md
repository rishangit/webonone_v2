# Host Media on IIS — manual steps

Host **media.webonone.com** with IIS physical path set to **`media\deploy`**.

Run **`npm run deploy:media`** when you are ready to publish. That builds the app and stages output into `media\deploy\`. Normal development (`npm run dev:media`) and compile-only builds (`npm run build:media`) do **not** touch this folder.

```text
media\deploy\              ← IIS physical path (generated on deploy)
  web.config               HttpPlatformHandler → node dist/server.js
  dist\                    backend build (entry: dist/server.js)
  public\                  frontend build
  logs\                    Node stdout/stderr
  IIS.md                   this guide (not served by the app)
  stage-deploy.ps1         staging script (not served by the app)

media\backend\.env         ← runtime secrets (read directly by Node on IIS)
media\backend\storage\     ← uploaded blobs (local storage driver)
node_modules\              ← at repo root (npm install); Node resolves deps from here
```

Committed files in `media\deploy\`: **`web.config`**, **`stage-deploy.ps1`**, **`IIS.md`** only.

---

## Prerequisites

Identity must be deployed at **https://identity.webonone.com** with a platform-wide redirect allowlist:

- `identity\backend\.env` → `ALLOWED_REDIRECT_URIS=https://*.webonone.com`
- `identity\frontend\.env.production` → `VITE_ALLOWED_REDIRECT_URIS=https://*.webonone.com`

This allows Media login callbacks on `https://media.webonone.com/callback`. After updating Identity env, run `npm run deploy:identity` and recycle the Identity app pool.

---

## Step 1 — Install prerequisites

On the Windows Server:

1. **IIS** — Server Manager → Add Roles → Web Server (IIS)
2. **[HttpPlatformHandler](https://www.iis.net/downloads/microsoft/httpplatformhandler)** — x64 installer
3. **Node.js LTS** (22.x) — default install path `C:\Program Files\nodejs\`
4. **MySQL** — create database `webonone_media` and a user with access to it

---

## Step 2 — DNS and certificate

1. Add DNS record: **media.webonone.com** → server IP (`A` or `CNAME`)
2. In IIS, have a TLS certificate that covers **media.webonone.com** (or `*.webonone.com`)

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
copy media\backend\.env.example media\backend\.env
New-Item -ItemType Directory -Path media\backend\storage -Force
```

Edit `media\backend\.env` — set `DB_*`, `JWT_SECRET` (must match `identity\backend\.env`), and production values:

| Variable | Production value |
|----------|------------------|
| `MEDIA_STORAGE_DRIVER` | `local` |
| `MEDIA_LOCAL_STORAGE_PATH` | `./storage` |
| `MEDIA_PUBLIC_BASE_URL` | `https://media.webonone.com/api/v1` |
| `ALLOWED_PARENT_ORIGINS` | `https://app.webonone.com` |

For IIS, HttpPlatformHandler sets `PORT` at runtime — a `PORT` line in this file is ignored when `IIS_NODE_HOSTED=1`.

### Frontend (build-time only)

```powershell
copy media\frontend\.env.example media\frontend\.env.production
```

Edit `media\frontend\.env.production` — production values:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `/api/v1` |
| `VITE_IDENTITY_ORIGIN` | `https://identity.webonone.com` |
| `VITE_IDENTITY_API_BASE_URL` | `https://identity.webonone.com/api/v1` |
| `VITE_ALLOWED_PARENT_ORIGINS` | `https://app.webonone.com` |
| `VITE_ALLOWED_FRAME_ANCESTORS` | `https://app.webonone.com` |

Vite embeds these values during deploy build. Changes require redeploy.

Keep **`ALLOWED_PARENT_ORIGINS`** (backend) and **`VITE_ALLOWED_PARENT_ORIGINS`** (frontend) in sync.

---

## Step 5 — Run database migrations

```powershell
cd C:\Projects\webonone_v2
npm run migrate -w media-root
```

---

## Step 6 — Deploy to IIS folder

```powershell
cd C:\Projects\webonone_v2
npm run deploy:media
```

This will:

1. Build shared packages (`@webonone/media-embed`, `@webonone/ui-kit`), frontend (using `frontend\.env.production`), and backend
2. Copy output into `media\deploy\public\` and `media\deploy\dist\`

Dependencies are **not** copied into `deploy\`. Node resolves packages from the repo root `node_modules\`.

To re-stage without rebuilding (after you already ran a build):

```powershell
cd C:\Projects\webonone_v2\media
npm run stage:deploy
```

To remove generated output during development (keeps only `web.config`, `stage-deploy.ps1`, `IIS.md`):

```powershell
cd C:\Projects\webonone_v2\media
npm run clean:deploy
```

---

## Step 7 — Create the IIS website

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. **Site name:** `Media`
4. **Physical path:** `C:\Projects\webonone_v2\media\deploy`
5. **Binding:** Type `https`, Host name `media.webonone.com`, select your certificate
6. Click **OK**

### Application pool

1. Select the **Media** site → **Basic Settings** → note the app pool name
2. Open **Application Pools** → select that pool
3. **.NET CLR version:** **No Managed Code**

---

## Step 8 — Set folder permissions

Grant the app pool identity **Read & execute** on `media\deploy` (including subfolders), **Read** on `media\backend\.env`, **Write** on `media\backend\storage`, and **Read & execute** on the repo root `node_modules\`.

Typical identity: `IIS AppPool\Media` (if pool name is `Media`).

The app pool also needs **Write** on `media\deploy\logs`.

---

## Step 9 — Verify

| URL | Expected |
|-----|----------|
| `https://media.webonone.com/api/v1/health` | `{"status":"ok","service":"media"}` |
| `https://media.webonone.com/library` | Media library UI loads |
| Login via `/library` | Redirects to Identity, returns to Media |
| Upload a file | File appears in `media\backend\storage\` |

If the site fails, check `media\deploy\logs\` for Node errors.

---

## Wire WebOnOne consumer

After Media is verified, update `webonone-v2\frontend\.env.production` with `VITE_MEDIA_ORIGIN` and `VITE_MEDIA_API_BASE_URL` (see `webonone-v2\frontend\.env.example`), then:

```powershell
npm run deploy:webonone
```

Recycle the WebOnOne app pool.

---

## Redeploy after code changes

```powershell
cd C:\Projects\webonone_v2
git pull
npm run deploy:media
```

Recycle the IIS app pool or restart the site.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502.3 / site won't start | Install HttpPlatformHandler; confirm Node at `C:\Program Files\nodejs\node.exe` (or edit `processPath` in `web.config`) |
| Page spins / never loads (0 bytes, timeout) | **Do not hardcode `PORT=4003` in `web.config`.** Use `<environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />` |
| 500 / Node crash | Check `media\deploy\logs\` and `media\backend\.env` (DB credentials, `JWT_SECRET`) |
| SPA 404 | Confirm `media\deploy\public\index.html` exists — run `npm run deploy:media` |
| API 404 from SPA | Frontend must be built with `VITE_API_BASE_URL=/api/v1` in `frontend\.env.production` |
| Upload fails | App pool needs **Write** on `media\backend\storage\` |
| Login callback rejected | Identity `ALLOWED_REDIRECT_URIS` must include `https://*.webonone.com`; redeploy Identity |
| Embed postMessage rejected | Keep `ALLOWED_PARENT_ORIGINS` and `VITE_ALLOWED_PARENT_ORIGINS` in sync with consumer origin |
| DB errors | Run migrations; verify `DB_*` in `backend\.env` |

---

## Files in this folder

| File | Purpose |
|------|---------|
| [`web.config`](web.config) | IIS HttpPlatformHandler — runs `node dist/server.js` |
| [`stage-deploy.ps1`](stage-deploy.ps1) | Copies build output here (run via `npm run deploy -w media-root`) |
| [`IIS.md`](IIS.md) | This deployment guide |

Env templates live in **`media\backend\.env.example`** and **`media\frontend\.env.example`**.
