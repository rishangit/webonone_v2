---
name: support-agent
description: >-
  Support service agent for webonone-platform. Handles support/ frontend,
  backend, migrations — public help site, Markdown articles, search, and
  support.webonone.com IIS. Use when tasks touch support/ or help articles.
---

# Support agent skill

## Scope

- `support/frontend`, `support/backend`, `support/backend/migrations`
- Consumer Help links: WebOnOne and Website `VITE_SUPPORT_ORIGIN` (parent/consumer agents own those files)

## Model

- Public knowledge base. No JWT.
- Articles: YAML frontmatter (`title`, `category`, `slug`, `audience`, `order`, `summary`) + Markdown body.
- Catalog is built at compile time with `import.meta.glob` from `content/en` and `content/si`.
- Chrome i18n `en`/`si`; article bodies follow the active locale with English fallback when a Sinhala file is missing.

## Rules

- [ui-kit-consumption.mdc](../../rules/ui-kit-consumption.mdc)
- [frontend-i18n.mdc](../../rules/frontend-i18n.mdc)
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports
- [microservice-architecture.mdc](../../rules/microservice-architecture.mdc)
- [iis-deployment.mdc](../../rules/iis-deployment.mdc)
- [support-project.mdc](../../rules/support-project.mdc)

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3021 | `support/frontend/.env` |
| Backend | 4021 | `support/backend/.env` |

FE: `VITE_API_BASE_URL`, `VITE_WEBONONE_ORIGIN`, `VITE_WEBSITE_ORIGIN`.

## Key paths

- Articles: `support/frontend/src/content/en/**/*.md` and `support/frontend/src/content/si/**/*.md`
- Catalog: `support/frontend/src/features/docs/content/catalog.ts` (locale-aware; `useHelpCatalog` hook)
- Layout: `support/frontend/src/app/SupportLayout.tsx`
- Health: `support/backend/src/routes/health.routes.ts`

## Verification

```bash
npm run type-check -w support-root
npm run migrate -w support-root
```

Manual: `http://127.0.0.1:3021` home, article, search; `http://127.0.0.1:4021/api/v1/health`.
