# Host Identity on IIS — manual steps

Host **identity.webonone.com** with IIS physical path set to **`identity\deploy`**.

Run **`npm run deploy:identity`** when you are ready to publish. That builds the app and stages output into `identity\deploy\`. Normal development (`npm run dev:identity`) and compile-only builds (`npm run build:identity`) do **not** touch this folder.

```text
identity\deploy\          ← IIS physical path (generated on deploy)
  web.config              HttpPlatformHandler → node dist/server.js
  dist\                   backend build (entry: dist/server.js)
  public\                 frontend build
  logs\                   Node stdout/stderr
  IIS.md                  this guide (not served by the app)
  stage-deploy.ps1        staging script (not served by the app)

identity\backend\.env     ← runtime secrets (read directly by Node on IIS)
node_modules\             ← at repo root (npm install); Node resolves deps from here
```

Committed files in `identity\deploy\`: **`web.config`**, **`stage-deploy.ps1`**, **`IIS.md`** only.

---

## Step 1 — Install prerequisites

On the Windows Server:

1. **IIS** — Server Manager → Add Roles → Web Server (IIS)
2. **[HttpPlatformHandler](https://www.iis.net/downloads/microsoft/httpplatformhandler)** — x64 installer
3. **Node.js LTS** (22.x) — default install path `C:\Program Files\nodejs\`
4. **MySQL** — create database `identity` and a user with access to it

---

## Step 2 — DNS and certificate

1. Add DNS record: **identity.webonone.com** → server IP (`A` or `CNAME`)
2. In IIS, have a TLS certificate that covers **identity.webonone.com** (or `*.webonone.com`)

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

`npm run deploy:identity` runs `npm run env:apply`, which writes `identity\backend\.env` and `identity\frontend\.env.production` (and the same for every other service). Do not hand-copy per-service `.env.example` for production.

For IIS, HttpPlatformHandler sets `PORT` at runtime — a `PORT` line in generated backend files is ignored when `IIS_NODE_HOSTED=1`.

**Warning:** Keep `production.env` only on the ops/IIS machine. Running `env:apply` overwrites every service’s `backend\.env`.

---

## Step 5 — Run database migrations

```powershell
cd C:\Projects\webonone_v2\identity
npm run migrate
```

---

## Step 6 — Deploy to IIS folder

```powershell
cd C:\Projects\webonone_v2
npm run deploy:identity
```

This will:

1. Run `env:apply` (expand root `production.env` into each service’s `backend\.env` + `frontend\.env.production`)
2. Build frontend (using `frontend\.env.production`) and backend
3. Copy output into `identity\deploy\public\` and `identity\deploy\dist\`

Dependencies are **not** copied into `deploy\`. Node resolves packages from the repo root `node_modules\` (install once with `npm install` at repo root). No `package.json` in `deploy\` is required.

To re-stage without rebuilding (after you already ran a build):

```powershell
cd C:\Projects\webonone_v2\identity
npm run stage:deploy
```

To remove generated output during development (keeps only `web.config`, `stage-deploy.ps1`, `IIS.md`):

```powershell
cd C:\Projects\webonone_v2\identity
npm run clean:deploy
```

---

## Step 7 — Create the IIS website

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. **Site name:** `Identity`
4. **Physical path:** `C:\Projects\webonone_v2\identity\deploy`
5. **Binding:** Type `https`, Host name `identity.webonone.com`, select your certificate
6. Click **OK**

### Application pool

1. Select the **Identity** site → **Basic Settings** → note the app pool name
2. Open **Application Pools** → select that pool
3. **.NET CLR version:** **No Managed Code**

---

## Step 8 — Set folder permissions

Grant the app pool identity **Read & execute** on `identity\deploy` (including subfolders), **Read** on `identity\backend\.env`, and **Read & execute** on the repo root `node_modules\`.

Typical identity: `IIS AppPool\Identity` (if pool name is `Identity`).

The app pool also needs **Write** on `identity\deploy\logs`.

---

## Step 9 — Verify

| URL | Expected |
|-----|----------|
| `https://identity.webonone.com/login` | Login page loads |
| `https://identity.webonone.com/api/v1/health` | `{"status":"ok","service":"identity"}` |

If the site fails, check `identity\deploy\logs\` for Node errors.

---

## Google Sign-In (optional)

1. Google Cloud Console → OAuth Client → **Authorized JavaScript origins:** `https://identity.webonone.com`
2. Set the same `GOOGLE_CLIENT_ID` in `identity\backend\.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend\.env.production`, then run `npm run deploy:identity`

---

## Redeploy after code changes

```powershell
cd C:\Projects\webonone_v2
git pull
npm run deploy:identity
```

Recycle the IIS app pool or restart the site.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502.3 / site won't start | Install HttpPlatformHandler; confirm Node at `C:\Program Files\nodejs\node.exe` (or edit `processPath` in `web.config`) |
| Page spins / never loads (0 bytes, timeout) | **Do not hardcode `PORT=4001` in `web.config`.** Use `<environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />` so Node listens on the same dynamic port HttpPlatformHandler forwards to |
| 500 / Node crash | Check `identity\deploy\logs\` and `identity\backend\.env` (DB credentials, `JWT_SECRET`) |
| Login page 404 | Confirm `identity\deploy\public\index.html` exists — run `npm run deploy:identity`; backend must resolve `deploy\public` when `IIS_NODE_HOSTED=1` |
| API 404 | Frontend must be built with `VITE_API_BASE_URL=/api/v1` in `frontend\.env.production` |
| DB errors | Run migrations; verify `DB_*` in `backend\.env` |

---

## Files in this folder

| File | Purpose |
|------|---------|
| [`web.config`](web.config) | IIS HttpPlatformHandler — runs `node dist/server.js` |
| [`stage-deploy.ps1`](stage-deploy.ps1) | Copies build output here (run via `npm run deploy -w identity-root`) |
| [`IIS.md`](IIS.md) | This deployment guide |

Env templates live in **`identity\backend\.env.example`** and **`identity\frontend\.env.example`**.
