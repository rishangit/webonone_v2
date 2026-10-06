# Development summary — 0031

| Field | Value |
|-------|-------|
| Ticket | `0031` |
| Feedback id | `uahK_56Vpc5IwwF4hKULM` |
| Title | Unable to retrieve SMS balance |
| Type | `bug` |
| Completed | `2026-10-06` |

## What was delivered

SMS Dashboard credits no longer fail when Text.lk returns remaining units under **`data.remaining_balance`** (the live API-v3 field). The balance parser also rejects boolean `status: false` and treats HTTP 200 `Unauthenticated` as credential rejection. Provider failures still map to the friendly **"Unable to retrieve SMS balance"** message; server logs include the non-secret provider reason.

## Where to see it

| Surface | Path |
|---------|------|
| Staging SMS | WebOnOne → **SMS → Dashboard** as company owner or Super Admin (Text.lk configured under Devices → Settings) |
| Credits card | Remaining SMS credits when Text.lk responds successfully |
| Local | `npm run dev:sms` → `http://127.0.0.1:3016/` |

## Feature details

- Parses `remaining_balance` / `available_balance` in addition to prior `balance` / `credits` / `sms_balance` / `remaining` fields.
- Boolean and string Text.lk error statuses both fail closed (no invented balance).
- Invalid tokens (including HTTP 200 + Unauthenticated) stay non-retryable credential failures.
- API response still never includes the Text.lk token.

## Code and docs touched

| Root | Key paths |
|------|-----------|
| `sms/backend` | `textLkProvider.service.ts`, `providerBalance.service.ts`, balance unit tests |
| `spec/0031/` | `spec.md`, `plan.md`, this summary |

## Verification run

```bash
npm run test -w @webonone/sms-backend
npm run type-check -w sms-root
npm run lint -w @webonone/sms-frontend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0031: fix Text.lk SMS balance remaining_balance parse` |
| Workflow | Push runs `.github/workflows/deploy-staging.yml` |
| **Expected mode** | `selective` |
| **Services** | `sms` |
| **Why** | Changed paths under `sms/` (`spec/` ignored for IIS) |
| Detect command | `node tooling/detect-changed-services.mjs --files <sms + spec/0031 paths> --print` (working tree vs empty HEAD diff before commit) |

## Support status

`staging` after successful push (`closed` remains super admin).
