# Development summary — Feedback 0023

| Field | Value |
|-------|-------|
| Ticket | `0023` |
| Feedback id | `qc8XFtn7NYsGe9lHwh-KY` |
| Title | Unnable to sign out from the support header |
| Type | `bug` |
| Completed | `2026-10-05` |

## What was delivered

Support header **Sign out** now clears Support auth storage and routes through Identity `/logout` via `performPlatformLogout`, then returns to the public Support home as a guest. Silent SSO re-login after Sign out is fixed; the avatar menu is replaced by **Sign In**.

## Where to see it

| Surface | How |
|---------|-----|
| Staging Support | Open Support help site → Sign In → user menu → Sign out → public home (Sign In visible) |
| Local | `npm run dev:support` → `http://127.0.0.1:3021` → same flow |
| Support docs | Not updated (bug fix only) |

## Feature details

- Clears `support_auth` before navigation (`clearSupportAuthStorage`).
- Identity SSO revoked via `/logout` with `post_logout_redirect_uri` = Support `{origin}/` (avoids Support `/login` auto-redirect to Identity).
- Guest chrome after return: Sign In button, no avatar / Sign out menu.

## Code and docs touched

| Root | Paths |
|------|-------|
| `support/frontend` | `src/features/docs/components/SupportHeader.tsx` |
| `spec/0023/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0023: fix support header sign out SSO re-login` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
