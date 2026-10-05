# Development summary — Feedback 0024

| Field | Value |
|-------|-------|
| Ticket | `0024` |
| Feedback id | `H_a36KioeTwfI7jX4ChAp` |
| Title | Auto-relogin with the previous user in support when clicking the bug & feature |
| Type | `bug` |
| Completed | `2026-10-05` |

## What was delivered

Support login redirects to Identity with `prompt=login`, so Bug & Feature and Sign In no longer silent-SSO as a previous Identity user. Guests see the Identity login form and must authenticate interactively before reaching `/feedback`. Local Support `/login` navigations also carry `prompt=login` for consistency.

## Where to see it

| Surface | Path |
|---------|------|
| Staging Support | `https://staging-support.webonone.com/` → Bug & Feature / Sign In |
| Local | `npm run dev:support` (+ Identity) → open as guest → Bug & Feature |
| Support docs | none (bug fix) |

## Feature details

- `buildIdentityLoginUrl` always adds `prompt=login` to the Identity OAuth login URL.
- `PrivateRoute` and header Sign In navigate to `/login?prompt=login&return=…`.
- Platform handoff (`code` / embed) is unchanged.
- After interactive login, return path defaults to `/feedback`.

## Code and docs touched

| Root | Paths |
|------|-------|
| `support/frontend` | `features/auth/utils/buildIdentityLoginUrl.ts`, `features/auth/components/PrivateRoute.tsx`, `features/docs/components/SupportHeader.tsx` |
| `spec/0024/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0024: force Support login prompt for Bug and Feature` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
