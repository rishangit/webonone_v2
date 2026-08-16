# Host AI on IIS — manual steps

Host **ai.webonone.com** with IIS physical path set to **`ai\deploy`**.

Run **`npm run deploy:ai`** when you are ready to publish. Normal development (`npm run dev:ai`) does **not** touch this folder.

```text
ai\deploy\              ← IIS physical path
  web.config
  dist\                 backend build
  public\               frontend build
  logs\

ai\backend\.env         ← runtime secrets
```

Committed files: **`web.config`**, **`stage-deploy.ps1`**, **`IIS.md`** only.

## Prerequisites

Identity must be deployed. Create MySQL database `webonone_ai`.

## Deploy

```powershell
npm run migrate -w ai-root
npm run deploy:ai
```

IIS site: host `ai.webonone.com`, physical path `ai\deploy`, app pool **No Managed Code**.

| URL | Expected |
|-----|----------|
| `https://ai.webonone.com/api/v1/health` | `{"status":"ok","service":"ai"}` |
| `https://ai.webonone.com/` | AI UI loads |

Provider keys (`AI_PROVIDER`, `AI_PROVIDER_BASE_URL`, `AI_PROVIDER_API_KEY`) come from root `production.env`. Never commit them.
