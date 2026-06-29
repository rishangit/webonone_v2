# 03 — Sending engine (1.9.0)

SMTP delivery, queue, templates, branding, and internal send => API. Implements ClickUp subtask **86ey38852**.

## Principles

- **All mail sent from Email backend** — never from browser or consumer SMTP.
- **One shared mail sender** — singleton SMTP transport configured from env.
- **Queue-first** — every send (internal or UI-triggered) enqueues then processes asynchronously.
- **Credentials protected** — SMTP password only in `email/backend/.env`; redact in logs.

## SMTP configuration

`email/backend/.env.example`:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_ADDRESS=noreply@example.com
SMTP_FROM_NAME=WebOnOne
SMTP_TLS_REJECT_UNAUTHORIZED=true
FRONTEND_BASE_URL=http://localhost:3004
```

| Setting | Purpose |
|---------|---------|
| `FRONTEND_BASE_URL` | Base for link placeholders in templates (Identity reset URLs use Identity origin — passed in payload) |
| `SMTP_FROM_NAME` | Display name on all outbound mail |

Startup: optional `verifySmtpConnection()` on worker start; log warning if unreachable (do not crash dev).

## Database schema (email tables)

| Table | Purpose |
|-------|---------|
| `email_templates` | `id`, `slug`, `name`, `subject`, `html_body`, `text_body`, `scope` (`platform` \| `company`), `company_id` nullable, `is_active`, timestamps |
| `email_template_versions` | Version history for restore |
| `email_company_branding` | `company_id`, name, logo_url, primary_color, contact_email, footer_html |
| `email_providers` | Platform SMTP metadata (non-secret fields); secrets stay in env for 1.9.0 |
| `email_queue` | `id`, `template_slug`, `to_email`, `payload_json`, `company_id`, `status`, `retry_count`, `max_retries`, `scheduled_at`, `processed_at`, `last_error` |
| `email_history` | Immutable send record: queue_id, status, provider_message_id, sent_at, recipient, template_slug, company_id |
| `email_audit_log` | Admin actions: who, action, entity, metadata |

## Template system

### Slugs (required in 1.9.0)

| Slug | Purpose | Link expiry |
|------|---------|-------------|
| `password_reset` | Identity forgot-password | 1 hour (link in payload) |
| `email_verification` | Identity verify email | 24 hours |
| `welcome` | Post-registration | — |
| `company_registered` | WebOnOne registration submitted | — |
| `company_approved` | Super admin approved company | — |
| `company_rejected` | Super admin rejected company | — |

Seed platform-default templates in migration or seed script.

### Placeholder replacement

Simple `{{key}}` replace in subject, HTML, and text bodies. Required keys validated before enqueue.

Common placeholders: `userName`, `companyName`, `actionUrl`, `logoUrl`, `primaryColor`, `footerHtml`, `year`.

Every message includes **multipart/alternative**: HTML + plain text derived from template or stripped HTML.

### Company overrides

- Platform template is fallback when no active company override exists.
- Company admin edits create/update row with `scope=company`, `company_id` set.
- Super admin manages platform templates only.

### Branding merge

On render for company-scoped sends:

1. Load `email_company_branding` for `company_id`.
2. Inject branding placeholders into template before send.

## Queue and worker

### Enqueue

`EmailQueueService.enqueue({ templateSlug, toEmail, payload, companyId?, priority? })` → insert `email_queue` status `pending`.

### Worker

In-process interval (e.g. every 5s) or immediate process after enqueue for dev:

1. Pick next `pending` (or `failed` with `retry_count < max_retries` and backoff).
2. Mark `processing`.
3. Resolve template (company override → platform).
4. Render HTML + text.
5. Send via nodemailer (or equivalent).
6. On success: `sent`, insert `email_history`.
7. On failure: increment `retry_count`, set `failed` or `pending` with delay; store `last_error`.

Default `max_retries`: 3 with exponential backoff (1m, 5m, 15m).

## Internal send API

**Route:** `POST /api/v1/internal/send`

**Auth:** Header `X-Email-Service-Key: {EMAIL_SERVICE_API_KEY}` — middleware `internalAuth.ts`. Reject if missing/invalid.

**Body (Zod validated):**

```typescript
{
  templateSlug: string
  toEmail: string
  payload: Record<string, string>  // placeholder values
  companyId?: string
  requestedByService: 'identity' | 'webonone'
}
```

**Response:** `{ queueId: string, status: 'queued' }` — always async.

Consumer backends store same `EMAIL_SERVICE_API_KEY` and `EMAIL_API_BASE_URL` in their `.env.example`.

## Public send API (UI)

JWT + role required:

- `POST /api/v1/send` — manual send (company_admin/super_admin)
- `POST /api/v1/send/test` — test to specified address

Validate template access by role and company scope.

## Provider management API

Super admin only:

- `GET /api/v1/providers` — non-secret config + connection status
- `POST /api/v1/providers/test` — send test ping via SMTP

Do not expose `SMTP_PASSWORD` in API responses.

## Acceptance (subtask 2)

- [ ] SMTP configured via env; connection validated
- [ ] Queue processes with retries and history
- [ ] Platform + company templates with placeholders
- [ ] Branding applied for company sends
- [ ] Internal API accepts Identity/WebOnOne requests
- [ ] HTML + plain text for every message
- [ ] password_reset and email_verification templates seeded
