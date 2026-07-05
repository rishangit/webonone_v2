# 02 — Cross-service navigation fix (1.11.2)

## Problem

When a satellite FE builds platform core nav via `buildCoreNav` / `resolvePlatformNavUrls`, it passes only its **own** origin as `externalOrigins`. Peer service leaves resolve to the **core origin** + sentinel path:

```text
Data buildCoreNav(..., { data: dataOrigin })
  → Email → Templates href = {coreOrigin}/email/templates   ← not routed on WebOnOne

Email buildCoreNav(..., { email: emailOrigin })
  → Data → Tags href = {coreOrigin}/data/tags                 ← not routed on WebOnOne
```

`withClientSideNavigation` attaches `onClick` only to paths starting with `/` (local). Full URLs navigate away to core — user sees **Home**.

## Required fix

Mirror the **WebOnOne consumer pattern** on both satellites for **peer** sentinels only.

### Reference implementations

| Pattern | File |
|---------|------|
| Email outbound from core | `webonone-v2/frontend/src/features/email/utils/redirectToEmail.ts` |
| Data outbound from core | `webonone-v2/frontend/src/features/data/utils/redirectToData.ts` |
| Sentinel intercept | `webonone-v2/frontend/src/app/AppLayout.tsx` `withExternalNavActions` |
| Email outbound from Identity | `identity/frontend/src/app/AppLayout.tsx` `withEmailNavAction` |

### Data frontend (consumer → Email)

| File | Action |
|------|--------|
| `features/email/utils/emailConfig.ts` | **Create** — `getEmailOrigin()`, `getEmailAppUrl(path)` from `VITE_EMAIL_ORIGIN` |
| `features/email/utils/redirectToEmail.ts` | **Create** — `getEmailRedirectOptions({ accessToken, returnUrl, navVariant, emailNavSentinel, extraSearchParams })` |
| `app/AppLayout.tsx` | **Update** — `handleEmailNavClick` + attach `onClick` on `isEmailNavSentinel` items before `withClientSideNavigation` |
| `frontend/.env.example` | **Update** — document `VITE_EMAIL_ORIGIN` if missing |

**Redirect options contract:**

- `authCodeEndpoint`: Identity API `/auth/code`
- `targetUrl`: `{emailOrigin}{path}` where path from `emailSentinelToExternalPath(sentinel)`
- `returnUrl`: Data origin + `/` (current satellite home — same as WebOnOne pattern)
- `extraSearchParams`: `core_nav`, theme relay from `relayThemeQueryParams(searchParams)`

### Email frontend (consumer → Data)

| File | Action |
|------|--------|
| `features/data/utils/dataConfig.ts` | **Create** — `getDataOrigin()`, `getDataAdminUrl(path)` from `VITE_DATA_ORIGIN` |
| `features/data/utils/redirectToData.ts` | **Create** — `getDataRedirectOptions({ accessToken, returnUrl, navVariant, dataNavSentinel, extraSearchParams })` |
| `app/AppLayout.tsx` | **Update** — `handleDataNavClick` + attach `onClick` on `isDataNavSentinel` items |
| `frontend/.env.example` | **Update** — document `VITE_DATA_ORIGIN` if missing |

### Optional shared helper

If `withExternalNavActions` is duplicated across three AppLayouts, extract to `packages/platform-nav` (e.g. `attachExternalNavActions(items, { onEmailNavClick?, onDataNavClick? })`). Not required if inline helper matches WebOnOne.

## Behaviour after fix

```text
User on Data /tags (platform mode)
  → clicks Email → Templates (sentinel /email/templates)
  → handleEmailNavClick
  → POST Identity /auth/code
  → window.location → {emailOrigin}/templates?code&return_url={dataOrigin}/&core_nav=…
  → Email home/bootstrap page exchanges code
  → User sees Email Templates in core AppShell
```

Reverse path (Email → Data) symmetric.

## Acceptance

| Step | Expected |
|------|----------|
| WebOnOne → Data → Tags | Unchanged — local nav |
| Data → Email → Templates | Email `/templates`, not core `/` |
| Email → Data → Tags | Data `/tags`, not core `/` |
| Data → Home | Core origin `/` with platform query preserved |
| Email → Settings → Basic | Core `/settings/basic` |
| Member role (no Email nav) | Unchanged — Email group hidden per nav variant |

## ClickUp

Subtask **86ey5we2u** — [Bug] issue in navigation with service.
