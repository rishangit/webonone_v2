# 06 — SMS templates (1.12.0)

SMS templates for **both** the system (platform, super admin) and **company owners** (company scope). Defines ownership, scope + override behavior, seeds, placeholders, SMS-specific length rules, versioning, and the management API/UI. Implements ClickUp subtask **TBD** (part of the sending engine + management screens).

## Why two scopes

| Operator | Owns | Typical templates |
|----------|------|-------------------|
| **Super admin (system)** | `platform` templates — defaults for the whole platform | `otp`, `phone_verification`, `password_reset`, `security_alert`, `welcome` |
| **Company owner/admin** | `company` templates — their own message content | `order_confirmation`, `appointment_reminder`, `delivery_update`, `promo`, plus **overrides** of platform slugs |

A company owner can (a) author brand-new templates for their own use cases, and (b) override a platform template's body for their own company without affecting other companies or the platform default.

## Data model

Templates live in `sms_templates` (+ `sms_template_versions` for restore) from [03-gateway-and-sending-engine.md](./03-gateway-and-sending-engine.md):

| Column | Notes |
|--------|-------|
| `id` | nanoid(21) |
| `slug` | Stable key, e.g. `otp`, `order_confirmation` |
| `name` | Human label shown in UI |
| `body` | SMS text with `{{placeholders}}` (no HTML/subject — SMS is body-only) |
| `scope` | `platform` \| `company` |
| `company_id` | null for platform; set for company templates/overrides |
| `is_active` | Soft enable/disable |
| `required_keys` | JSON array of placeholder keys validated before enqueue |
| timestamps | `created_at`, `updated_at` |

**Uniqueness:** `(slug, scope, company_id)` unique — a company may hold at most one override per slug; the platform holds at most one default per slug.

## Resolution + override rule

When enqueuing with a `templateSlug` and optional `companyId`:

```text
1. If companyId is set → look for active company template (scope=company, company_id) with that slug.
2. Else / if none → fall back to the active platform template (scope=platform) with that slug.
3. If neither exists → reject enqueue (unknown template).
```

- Platform message (no `companyId`) always uses the platform template.
- Company message uses the company override when present, otherwise the platform default.
- Super admin never sees or edits company-authored templates through platform screens; company admin never edits platform defaults.

## Placeholders

- Syntax: `{{key}}` replaced from the send `payload`. `required_keys` are validated before enqueue; missing keys fail fast with a clear error.
- Common keys: `code`, `minutes`, `name`, `companyName`, `orderId`, `amount`, `date`, `time`, `link`.
- A short `{{companyName}}` sender prefix is recommended for company templates so recipients recognize the sender (no alphanumeric sender ID — the SIM number is the sender).

## SMS length + encoding rules

SMS billing/segmentation differs from email — surface this in the editor:

| Encoding | Single segment | Multi-segment part |
|----------|----------------|--------------------|
| GSM-7 (basic Latin) | 160 chars | 153 chars/part |
| UCS-2 (emoji / non-Latin) | 70 chars | 67 chars/part |

- The template editor shows a **live character + segment counter** and warns when a message will split into multiple segments (each segment is a separately-billed SMS on the SIM).
- After placeholder substitution the final length can grow; the counter estimates using representative sample values.
- Keep OTP/verification templates within one GSM-7 segment where possible.

## Seeds (migration)

Seed **platform** templates only (companies create their own as needed):

| Slug | Body (default) | required_keys |
|------|----------------|---------------|
| `otp` | `Your WebOnOne code is {{code}}. It expires in {{minutes}} minutes.` | `code`, `minutes` |
| `phone_verification` | `Verify your number with code {{code}} on WebOnOne.` | `code` |
| `password_reset` | `Your WebOnOne password reset code is {{code}}.` | `code` |
| `generic` | `{{body}}` | `body` |

Company templates are **not** seeded — they are authored by each company owner.

## Management API

Reuses the public API from [03](./03-gateway-and-sending-engine.md), role-scoped:

| Route | super_admin | company_admin |
|-------|-------------|---------------|
| `GET /api/v1/templates` | all platform templates | own company templates + resolvable platform defaults (read-only) |
| `POST /api/v1/templates` | create `platform` template | create `company` template (scope + `company_id` forced from JWT) |
| `PUT /api/v1/templates/:id` | edit platform template | edit only own company template |
| `GET /api/v1/templates/:id/versions` + `POST /api/v1/templates/:id/restore` | platform | own company only |
| `POST /api/v1/templates/:id/preview` | render with sample payload | render with sample payload |

- `scope` and `company_id` are **always derived server-side** from the JWT — never client-supplied.
- Company admin requests are hard-filtered to their `company_id`; attempts to touch platform or another company's template return 403.
- Every create/update/delete/restore writes `sms_audit_log`.

## Management UI (Templates screen)

`sms/frontend` Templates feature (role-gated per [02-sms-service-scaffold.md](./02-sms-service-scaffold.md)):

- **Super admin:** list/edit platform defaults; cannot see company templates.
- **Company owner/admin:** list own company templates; "Create template" for new company slugs; "Override" action on a platform default to fork a company-scoped copy pre-filled with the default body.
- Editor: name, slug (immutable after create), body textarea with live char/segment counter, `required_keys` chips, active toggle, **Preview** with sample payload, version history + restore.
- Follow `.cursor/skills/form-creation/SKILL.md` (Zod on FE + BE, required-field markers, inline errors) and `@webonone/ui-kit` primitives.

## Acceptance (templates)

- [ ] Platform templates seeded (`otp`, `phone_verification`, `password_reset`, `generic`)
- [ ] Super admin manages platform templates only
- [ ] Company owner creates own company templates and overrides platform slugs (company-scoped)
- [ ] Resolution: company override → platform default → reject if none
- [ ] `scope`/`company_id` server-derived; cross-company/platform edits blocked (403)
- [ ] Char/segment counter + multi-segment warning in editor
- [ ] `required_keys` validated before enqueue; version restore + audit log work
