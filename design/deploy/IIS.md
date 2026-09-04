# Host design on IIS — manual steps

Host **design.webonone.com** with IIS physical path set to **`design\deploy`**.

Run **`npm run deploy:design`** when you are ready to publish. That builds the app and stages output into `design\deploy\`. Normal development (`npm run dev:design`) and compile-only builds (`npm run build:design`) do **not** touch this folder.

```text
design\deploy\              ← IIS physical path (generated on deploy)
  web.config               HttpPlatformHandler → node dist/server.js
  dist\                    backend build (entry: dist/server.js)
  public\                  frontend build
  logs\                    Node stdout/stderr
  IIS.md                   this guide (not served by the app)
  stage-deploy.ps1         staging script (not served by the app)

design\backend\.env         ← runtime secrets (read directly by Node on IIS)
node_modules\              ← at repo root (npm install); Node resolves deps from here
```

Committed files in `design\deploy\`: **`web.config`**, **`stage-deploy.ps1`**, **`IIS.md`** only.

---

## Prerequisites

Identity must be deployed at **https://identity.webonone.com** with a platform-wide redirect allowlist. Set `ALLOWED_REDIRECT_URIS=https://*.webonone.com` in root `production.env`, then `npm run deploy:identity` and recycle the Identity app pool.

---

## Step 1 — Install prerequisites

On the Windows Server:

1. **IIS** — Server Manager → Add Roles → Web Server (IIS)
2. **[HttpPlatformHandler](https://www.iis.net/downloads/microsoft/httpplatformhandler)** — x64 installer
3. **Node.js LTS** (22.x) — default install path `C:\Program Files\nodejs\`
4. **MySQL** — create database `webonone_design` and a user with access to it

---

## Step 2 — DNS and certificate

**Production** (`{slug}.webonone.com`):

1. Add DNS record: **design.webonone.com** → server IP (`A` or `CNAME`)
2. Add a **wildcard** DNS record: **\*.webonone.com** → the same server IP
3. TLS certificate that covers **design.webonone.com** and **\*.webonone.com**

**Staging** (`{slug}.staging.webonone.com`):

A production wildcard **does not** cover nested names. `*.webonone.com` matches `acme.webonone.com` only — it does **not** match `acme.staging.webonone.com`. That lookup returns **NXDOMAIN**.

1. Add DNS: **design.staging.webonone.com** → staging server IP
2. Add a **separate** wildcard: **\*.staging.webonone.com** → the same staging IP
3. TLS certificate that covers **design.staging.webonone.com** and **\*.staging.webonone.com** (a `*.webonone.com` cert does not cover this)
4. Set `ORIGIN_DESIGN=https://design.staging.webonone.com` in `production.env` (apply derives `COMPANY_SITE_HOST=staging.webonone.com`). Redeploy Design **and** WebOnOne so profile URLs use the staging host.
5. IIS Design site: extra HTTPS binding host name `*.staging.webonone.com`

Copy the live URL from the company profile **Website** field — do not guess the slug.

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

Fill shared secrets (`JWT_SECRET`, service API keys, `DB_*`), origins (`ORIGIN_*`), and service-specific keys (including `design_SERVICE_API_KEY` and billing settings). See `production.env.example` comments.

`npm run deploy:design` runs `npm run env:apply`, which writes each service's `backend\.env` and `frontend\.env.production`. Do not hand-copy per-service `.env.example` for production.

For IIS, HttpPlatformHandler sets `PORT` at runtime — a `PORT` line in generated backend files is ignored when `IIS_NODE_HOSTED=1`.

**Warning:** Keep `production.env` only on the ops/IIS machine. Running `env:apply` overwrites every service's `backend\.env`.

---

## Step 5 — Run database migrations

```powershell
cd C:\Projects\webonone_v2
npm run migrate -w design-root
```

---

## Step 6 — Deploy to IIS folder

```powershell
cd C:\Projects\webonone_v2
npm run deploy:design
```

This will:

1. Run `env:apply` (expand root `production.env` into each service’s env files)
2. Build shared packages, frontend (using `frontend\.env.production`), and backend
3. Copy output into `design\deploy\public\` and `design\deploy\dist\`

Dependencies are **not** copied into `deploy\`. Node resolves packages from the repo root `node_modules\`.

To re-stage without rebuilding (after you already ran a build):

```powershell
cd C:\Projects\webonone_v2\design
npm run stage:deploy
```

To remove generated output during development (keeps only `web.config`, `stage-deploy.ps1`, `IIS.md`):

```powershell
cd C:\Projects\webonone_v2\design
npm run clean:deploy
```

---

## Step 7 — Create the IIS website

1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
3. **Site name:** `design`
4. **Physical path:** `C:\Projects\webonone_v2\design\deploy`
5. **Binding:** Type `https`, Host name `design.webonone.com` (or `design.staging.webonone.com` on staging), select your certificate
6. Add a second **https** binding on the same site: Host name `*.webonone.com` (production) or `*.staging.webonone.com` (staging), same certificate. Explicit service hosts (`app…`, `identity…`, `design…`) on other IIS sites take precedence; unmatched company subdomains land here.
7. Also add matching **http** bindings for ACME / HTTPS redirect if you use win-acme
8. Click **OK**

### Application pool

1. Select the **design** site → **Basic Settings** → note the app pool name
2. Open **Application Pools** → select that pool
3. **.NET CLR version:** **No Managed Code**

---

## Step 8 — Set folder permissions

Grant the app pool identity **Read & execute** on `design\deploy` (including subfolders), **Read** on `design\backend\.env`, and **Read & execute** on the repo root `node_modules\`.

Typical identity: `IIS AppPool\design` (if pool name is `design`).

The app pool also needs **Write** on `design\deploy\logs`.

---

## Step 9 — Verify

| URL | Expected |
|-----|----------|
| `https://design.webonone.com/api/v1/health` | `{"status":"ok","service":"design"}` |
| `https://design.webonone.com/` | design UI loads |
| `https://{web-slug}.webonone.com/` | Public company website (production; slug from company profile) |
| `https://{web-slug}.staging.webonone.com/` | Public company website (staging — needs `*.staging.webonone.com` DNS) |
| Login via platform nav | Redirects to Identity, returns to design |

If the site fails, check `design\deploy\logs\` for Node errors.

---

## Redeploy after code changes

```powershell
cd C:\Projects\webonone_v2
git pull
npm run deploy:design
```

Recycle the IIS app pool or restart the site.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502.3 / site won't start | Install HttpPlatformHandler; confirm Node at `C:\Program Files\nodejs\node.exe` (or edit `processPath` in `web.config`) |
| Page spins / never loads (0 bytes, timeout) | **Do not hardcode `PORT` in `web.config`.** Use `<environmentVariable name="PORT" value="%HTTP_PLATFORM_PORT%" />` |
| 500 / Node crash | Check `design\deploy\logs\` and `design\backend\.env` (DB credentials, `JWT_SECRET`) |
| SPA 404 | Confirm `design\deploy\public\index.html` exists — run `npm run deploy:design` |
| API 404 from SPA | Frontend must be built with `VITE_API_BASE_URL=/api/v1` in `frontend\.env.production` |
| Login callback rejected | Identity `ALLOWED_REDIRECT_URIS` must include `https://*.webonone.com`; redeploy Identity |
| Billing sync fails from WebOnOne | `design_SERVICE_API_KEY` must match across WebOnOne and design backends |
| DNS_PROBE_FINISHED_NXDOMAIN / site can’t be reached | Hostname is not in DNS. `{slug}.staging.webonone.com` needs **`*.staging.webonone.com`**, not only `*.webonone.com`. Copy the URL from the company profile. |

---

## Files in this folder

| File | Purpose |
|------|---------|
| [`web.config`](web.config) | IIS HttpPlatformHandler — runs `node dist/server.js` |
| [`stage-deploy.ps1`](stage-deploy.ps1) | Copies build output here (run via `npm run deploy -w design-root`) |
| [`IIS.md`](IIS.md) | This deployment guide |

Production secrets/origins: repo-root **`production.env`**. Local-dev templates: **`design\backend\.env.example`** and **`design\frontend\.env.example`**.
