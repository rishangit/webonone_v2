# Host Data on IIS — manual steps

Host **data.webonone.com** with IIS physical path set to **`data\deploy`**.

Run **`npm run build:data`** then **`npm run stage:deploy -w data-root`** when you are ready to publish. Normal development (`npm run dev:data`) and compile-only builds (`npm run build:data`) do **not** touch this folder unless deploy is run.

```text
data\deploy\              ← IIS physical path (generated on deploy)
  web.config               HttpPlatformHandler → node dist/server.js
  dist\                    backend build (entry: dist/server.js)
  public\                  frontend build
  logs\                    Node stdout/stderr
  IIS.md                   this guide (not served by the app)
```

Committed files in `data\deploy\`: **`web.config`**, **`IIS.md`** only.

---

## Prerequisites

- MySQL database **`webonone_data`**
- **`JWT_SECRET`** in `data\backend\.env` must match Identity production
- Identity redirect allowlist includes `https://data.webonone.com/callback`

---

## Production env

**Backend** (`data\backend\.env`):

- `DB_NAME=webonone_data`
- `JWT_SECRET` (same as Identity)
- `FRONTEND_BASE_URL=https://data.webonone.com`

**Frontend build** (`data\frontend\.env.production`):

- `VITE_API_BASE_URL=/api/v1`
- Peer origins for Identity and WebOnOne (production URLs)

---

## Verify

| Check | Expected |
|-------|----------|
| `https://data.webonone.com/api/v1/health` | `{ "status": "ok", "service": "data" }` |
| `data\deploy\public\index.html` | Exists after deploy |

```powershell
npm run migrate -w data-root
npm run build:data
```
