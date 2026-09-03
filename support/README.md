# Support

Public help site for WebOnOne users. Articles ship as Markdown in the frontend.

| Layer | Port | Workspace |
|-------|------|-----------|
| Frontend | 3021 | `@webonone/support-frontend` |
| Backend | 4021 | `@webonone/support-backend` |
| Production | — | `https://support.webonone.com` |

Database: `webonone_support` (placeholder `support_meta` only). Help content is static Markdown — not stored in MySQL.

## Local

```powershell
copy support\frontend\.env.example support\frontend\.env
copy support\backend\.env.example support\backend\.env
npm run migrate -w support-root
npm run dev:support
```

Open `http://127.0.0.1:3021`. Health: `http://127.0.0.1:4021/api/v1/health`.

Articles live in `frontend/src/content/{en,si}/**/*.md`. Add YAML frontmatter (`title`, `category`, `slug`, `audience`, `order`, `summary`) and a short how-to body. Mirror each English article under `content/si/` for Sinhala; missing Sinhala files fall back to English when the locale is `si`.

IIS: [deploy/IIS.md](deploy/IIS.md).
