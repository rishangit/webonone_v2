# 06 — Platform integration (1.11.0)

Nav handoff, peer env configuration, and production deploy for `data.webonone.com`.

## WebOnOne core nav

Add **Data** entry to platform navigation (same pattern as Email):

| Approach | Detail |
|----------|--------|
| **Preferred** | Extend `packages/platform-nav/src/coreNav.ts` with Data leaf |
| **WebOnOne** | `webonone-v2/frontend/src/features/data/utils/dataConfig.ts` — `getDataOrigin()`, `getDataAdminUrl()` |

Handoff: `buildPlatformRedirectUrl(dataOrigin, '/tags')` or dashboard `/` with auth-code when session crosses origin.

### WebOnOne env

Add to `webonone-v2/frontend/.env.example`:

```env
VITE_DATA_ORIGIN=
VITE_DATA_API_BASE_URL=
```

Derive API base as `{origin}/api/v1` in production; local dev uses `http://localhost:3005` and `http://localhost:4005/api/v1`.

### Data frontend env

```env
VITE_WEBONONE_ORIGIN=http://localhost:3000
VITE_WEBONONE_API_BASE_URL=http://localhost:4000/api/v1
```

## Identity

No Identity code changes required for 1.11.0 beyond existing login embed. Data FE uses same `identityConfig` pattern as Email.

Optional: add Data origin to Identity allowed redirect URIs documentation in `identity/frontend/.env.example` comments.

## Consumer services (future-ready)

Document read API for peer backends:

```text
GET https://data.webonone.com/api/v1/tags?status=verified&pageSize=100
Authorization: Bearer <user-jwt>
```

Consumers verify JWT locally; **do not** call Identity per request.

Event-based sync (`DataTagUpdated`) is out of scope for 1.11.0 — note in README for future spec.

## AGENTS.md update

Add Data row to service agents table when implementation completes:

| Agent | Root | Subagent | Skill |
| Data | `data/` | data-agent | data-agent/SKILL.md |

(Phase 6 — documentation only in build.)

## Deploy — data.webonone.com

Mirror `email/deploy/`:

| Artifact | Purpose |
|----------|---------|
| `data/deploy/web.config` | IIS Node + static FE |
| `data/deploy/IIS.md` | Host binding, env vars on server |
| `data/package.json` `deploy` | Stage `dist/` to deploy folder |

Production env (server `backend/.env`):

- `DATABASE_URL` → production MySQL `webonone_data`
- `JWT_SECRET` → same as Identity production
- `PORT` → set by IIS handler

Frontend build embeds `VITE_*` at build time for production origins.

## Security checklist

- [ ] JWT verify: `iss`, `aud`, `exp`, signature
- [ ] CORS: Data API allows Data FE origin only
- [ ] No secrets in `frontend/.env` committed
- [ ] `frame-ancestors` if any embed added later

## Acceptance

- [ ] WebOnOne AppLayout Data click opens Data origin with handoff
- [ ] `dataConfig.ts` follows peer config convention (origin + API base only)
- [ ] Deploy docs reference `data.webonone.com`
- [ ] Root `npm run dev` includes Data without breaking other services
