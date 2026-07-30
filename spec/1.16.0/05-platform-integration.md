# 05 — Platform integration and release (1.16.0)

WebOnOne company-activation sync, nav wiring, security rules, and end-to-end release checklist. Implements ClickUp subtask **TBD**.

## Integration overview

```text
WebOnOne BE ──HTTP internal (service key)──► Payment BE
   (company approve / reject)

Payment admin FE ──JWT──► Payment BE only
WebOnOne FE ──redirect / handoff──► Payment FE (Invoices)
Identity ──issues JWT──► verified locally by Payment BE
```

No shared database. Payment keeps local copies of `company_id`, name, and `activated_at`.

## WebOnOne — approve / reject hooks

In `webonone-v2/backend` company status service (after successful status PATCH):

| Company status change | Payment call |
|-----------------------|--------------|
| → `approved` | `POST /api/v1/internal/companies/upsert` with `activatedAt = approved_at`, `status: active`, `name` |
| → `rejected` or deactivate | upsert `status: inactive` (cancel subscription) |
| → `pending` (reset) | upsert `status: inactive` |

Failures: log + optionally queue retry; **do not** roll back company approval solely because Payment is down (degrade: invoices catch up when sync/backfill runs). Document ops backfill via `POST /internal/invoices/generate`.

### WebOnOne env

`webonone-v2/backend/.env.example`:

```env
PAYMENT_API_BASE_URL=http://localhost:4017
PAYMENT_SERVICE_API_KEY=dev-payment-service-key
```

`webonone-v2/frontend/.env.example`:

```env
VITE_PAYMENT_ORIGIN=http://localhost:3017
```

### Payment env

`payment/backend/.env.example`:

```env
PAYMENT_SERVICE_API_KEY=dev-payment-service-key
SYSTEM_MONTHLY_AMOUNT_LKR=3000
BILLING_TIMEZONE=Asia/Colombo
```

Duplicate `JWT_SECRET` from Identity (same as other services).

## platform-nav + AGENTS

- Add Payment to `ExternalServiceId` and super-admin nav ([04](./04-super-admin-invoices-ui.md)).
- Update `AGENTS.md` / root `dev` scripts when service lands.
- Add payment-agent skill (implementation phase).

## Security

| Rule | Detail |
|------|--------|
| Internal API key | Required on `/api/v1/internal/*`; rotate via env; never in FE |
| JWT on public API | Verify signature, `iss`, `aud`, `exp` locally |
| Role gates | Only `super_admin` mutates invoice status; list scope by role |
| No secrets in URLs | Auth-code handoff only — no JWT in query |
| Money integrity | Amounts from plan server-side; clients cannot set invoice totals on create |
| Audit | Log upsert, generate, mark-paid, void with actor id when JWT present |
| Isolation | Company admin (if enabled) only sees own `company_id` |

## Release checklist

1. [ ] Payment standalone: `dev:payment` → login shell; `/health` ok
2. [ ] Plan seeded: `platform_monthly` = LKR 3,000
3. [ ] Approve company in WebOnOne → Payment company + active subscription with correct `activated_at`
4. [ ] Invoice generator creates monthly invoices from activation; no duplicates on re-run
5. [ ] Super admin **Payment → Invoices** shows all companies' invoices with Rs amounts
6. [ ] Mark paid / void works; overdue flips after due date
7. [ ] Reject company → no new invoices; old invoices remain
8. [ ] Payment starts when WebOnOne is down; `/health` ok
9. [ ] `npm run type-check -w payment-root`; migrations apply; root `dev` includes Payment
10. [ ] No shared DB access; only CHAR(21) id copies

## Acceptance (subtask 4)

- [ ] WebOnOne approve/reject sync wired
- [ ] Env examples documented for WebOnOne + Payment
- [ ] Super-admin nav handoff works
- [ ] Security rules applied
- [ ] Full e2e flow ready for release
