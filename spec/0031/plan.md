# Plan — Feedback 0031

## Root cause

Text.lk `GET /api/v3/balance` success payloads put remaining SMS units under **`data.remaining_balance`** (API-v3 pattern confirmed by sibling gateway SDKs that share the same `/balance` contract). `parseTextLkBalanceBody` only checked `balance` / `credits` / `credit` / `sms_balance` / `remaining`, so a successful HTTP body was treated as malformed → `fetchTextLkBalance` `{ ok: false }` → `getTextLkProviderBalance` 502 **"Unable to retrieve SMS balance"**.

Secondary gap: official docs also use boolean `status: false` for errors; we only treated string `"error"`.

## Approach

Extend the Text.lk balance parser and error-status detection in `textLkProvider.service.ts`; add unit tests; optionally log provider `result.error` server-side without leaking tokens.

## Implementation steps

1. **`sms/backend/src/services/textLkProvider.service.ts`**
   - In `parseTextLkBalanceBody`, also read `remaining_balance` (and `available_balance` if present).
   - Treat `status === false` (and existing `status === 'error'`) as failure in both parse and `fetchTextLkBalance`.
   - Keep flexible parsing for shapes already covered in 0029 tests.

2. **`providerBalance.service.ts`**
   - On provider failure, log a short non-secret message (`result.error`) for staging diagnostics; API message stays generic.

3. **Tests** — `textLkProvider.balance.test.ts`
   - Success with `{ status: 'success', data: { remaining_balance: 1245 } }` (and string form).
   - Failure with `{ status: false, message: '…' }` under HTTP 200.

4. **Verify** — `npm run test -w @webonone/sms-backend`, `npm run type-check -w sms-root`.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- SMS-only change → selective deploy for `sms`.
- Do not invent balances from unrelated numeric fields (e.g. `cost` from send payloads).
