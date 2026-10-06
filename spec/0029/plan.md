# Plan — Feedback 0029

## Approach

Extend the existing SMS Text.lk provider layer with a balance fetch (`GET https://app.text.lk/api/v3/balance`), expose `GET /api/v1/providers/textlk/balance` with the same scope resolution as gateway settings, and add an SMS Credits card on the SMS Dashboard for admins.

## Backend

1. **`textLkProvider.service.ts`**
   - Add `fetchTextLkBalance(apiToken)` → `GET …/api/v3/balance` with Bearer + Accept JSON, timeout (~15s).
   - Export `parseTextLkBalanceBody(json)` for unit tests — accept common shapes (`data.balance`, `data.credits`, numeric `data`, top-level `balance`).
   - Map network/HTTP/malformed → structured `{ ok: false, error, retryable? }`.

2. **`providerBalance.service.ts`** (or gateway helper)
   - Resolve scope like `gateway.controller` (`super_admin` → platform; `company_admin` → JWT company).
   - If `!isTextLkReady` → `{ configured: false, balance: null, … }`.
   - Else decrypt credentials via `getTextLkCredentials`, call provider, return DTO + `lastUpdated`.
   - In-memory cache Map keyed by `scope:companyId`, TTL 60s; `force` skips read.

3. **Route / controller**
   - `GET /providers/textlk/balance` — `requireAuth` + `requireRole('super_admin','company_admin')`.
   - Query `force=1` optional.
   - Register in `app.ts`.

4. **Tests** (`node --import tsx --test`)
   - Parse success / malformed.
   - Provider mock fetch: success, 401, timeout, network error.
   - Service: not configured; company vs platform isolation of cache keys (pure helpers).
   - Add `"test"` script on `@webonone/sms-backend`.

## Frontend

1. **Types + `smsApi.getTextLkBalance({ force? })`**
2. **Feature store** `features/dashboard/store` — extend or add `smsCredits` slice/epic (`exhaustMap`, cache TTL, `force` on refresh). Prefer a small dedicated slice next to dashboard stats to keep refresh independent of stats.
3. **`SmsCreditsCard`** on `DashboardPage` when role is admin:
   - Loading: rely on `usePlatformLoading` for first load; card-local spinner on refresh OK.
   - Configured: formatted balance, “SMS Credits remaining”, Text.lk label, relative last updated, Refresh button.
   - Not configured: message + Link/Button to `/devices?tab=settings` (company) / same for platform.
   - Error: message + Retry.
4. **i18n** `shell` en + si keys.

## Support

Update `communications/sms-overview` and/or `sms-devices` (en + si): dashboard shows Text.lk credits when Text.lk is the gateway mode.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Public Text.lk HTML docs omit balance; SDK path is the source of truth — isolate URL in provider constant.
- Response field names may vary; flexible parser + tests.
- Do not add WebOnOne home card in this ticket (out of scope).
