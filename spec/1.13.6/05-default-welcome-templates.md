# 05 — Default welcome templates on company registration

ClickUp: [86eyd50wt](https://app.clickup.com/t/86eyd50wt)

## Problem

Welcome email/SMS on customer add need company-scoped templates. Today companies do not get a default `welcome` Email or SMS template when registered, so owners would have empty or platform-only messaging until they hand-author templates.

## Rule

**When a company is registered** in WebOnOne (`registerCompany` / equivalent), provision:

| Service | Scope | Slug | Purpose |
|---------|-------|------|---------|
| Email | `company` + `company_id` | `welcome` | Customer / member welcome email |
| SMS | `company` + `company_id` | `welcome` | Customer welcome text |

### Idempotency

If a company already has an active template for `(slug=welcome, scope=company, company_id)`, **skip** (no duplicate). Safe to call on retries.

### Default content

Copy from the **platform** `welcome` template when present; otherwise insert service defaults:

**Email (example defaults)**

| Field | Default |
|-------|---------|
| name | Welcome |
| subject | Welcome to {{companyName}} |
| body | Hello {{userName}}, welcome to {{companyName}}. … |
| required_keys | `userName`, `companyName` |

**SMS (example defaults)**

| Field | Default |
|-------|---------|
| name | Welcome |
| body | Welcome to {{companyName}}, {{userName}}! |
| required_keys | `userName`, `companyName` |

If platform SMS lacks `welcome`, add a **platform** seed in SMS migrations (this release) so company provision has a source — aligned with [1.12.0](../1.12.0/06-sms-templates.md) (which listed `welcome` for platform in overview but seeds may omit it).

## APIs

### Email

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/internal/companies/:companyId/templates/ensure-welcome` | Internal key |

Behavior: ensure company `welcome` exists (create from platform or defaults). Response `{ status: 'created' \| 'exists', templateId }`.

### SMS

Same shape:

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/internal/companies/:companyId/templates/ensure-welcome` | Internal key |

### WebOnOne hook

In `registerCompany` after company + owner role succeed:

```text
await ensureEmailWelcomeTemplate(companyId)
await ensureSmsWelcomeTemplate(companyId)
```

Fire-and-forget with logging is acceptable if registration must not fail when Email/SMS are down — **prefer await with try/catch**: registration succeeds; log provision failures; owners can create templates later in Email/SMS UIs. Document the soft-fail choice in implementation notes.

Optional: also call ensure on **company approve** for companies registered before this release (backfill) — nice-to-have, not required for v1 acceptance.

## Existing companies

Out of scope for automatic backfill unless implementers add a one-off migrate script. New registrations only for acceptance.

## Acceptance

1. Register company → Email Templates (company scope) includes `welcome`.
2. Register company → SMS Templates (company scope) includes `welcome`.
3. Second ensure call does not duplicate.
4. Customer add ([04](./04-welcome-notifications.md)) resolves company `welcome` without falling back when seed succeeded.
