# 01 — Overview (1.9.0)

## Vision

The platform gains a **standalone Email microservice** that owns SMTP delivery, templates, branding, queue processing, and audit history. Consumer services (Identity, WebOnOne) trigger sends through a **versioned internal HTTP API** — never from the browser and never with shared SMTP credentials. Administrators manage email through the Email service UI, reachable from WebOnOne’s main menu or directly at the Email origin with the same screens and role-based access.

## User story

As a platform operator or company administrator on the WebOnOne platform, I want a standalone Email microservice that I can open from WebOnOne v2 or directly at its own origin, so that the platform can send transactional emails asynchronously (verification, password reset, welcome, company approval/rejection, and future types), manage templates and branding per company, and keep a full audit trail — without coupling other services to SMTP or provider credentials.

## Goals (1.9.0)

1. **Standalone Email service** — `email/frontend`, `email/backend`, `email/backend/migrations`, own MySQL schema; `npm run dev:email` and `/health` without other services.
2. **Identity auth handoff** — JWT from Identity; role claims drive nav and API authorization (super admin, company admin, member).
3. **WebOnOne entry** — Email item in core platform nav; redirect to Email origin with existing session (auth-code / platform-nav pattern).
4. **Sending engine** — Server-side SMTP, queue with retries, template rendering (HTML + plain text), platform defaults and company overrides, branding injection.
5. **Management UI** — Dashboard, Send Email, Templates, History, Queue, Test Email, Providers, Settings — role-gated.
6. **Platform integration** — Identity: password reset + email verification; WebOnOne: company registration, approval, rejection emails.

## Scope (1.9.0)

### In scope

- New `email/` workspace registered in root `package.json`.
- Database tables: users mirror (id only), companies mirror, templates (+ versions), queue, send history, providers, audit log, branding.
- Internal API: `POST /api/v1/internal/send` (service-to-service, API key or mTLS-style shared secret).
- Public API: JWT-protected CRUD for templates, branding, manual send, test send, history/queue read — scoped by role.
- Initial templates: `password_reset`, `email_verification`, `welcome`, `company_registered`, `company_approved`, `company_rejected`.
- Token expiry: reset links 1 hour; verification links 24 hours (Identity owns token storage; Email only renders links from payload).
- Queue worker in Email backend (in-process poll or interval job for 1.9.0).

### Out of scope (1.9.0)

- Multiple SMTP providers per company (one platform provider config; company admins cannot change SMTP host).
- Marketing campaigns, bulk mailing lists, or open tracking pixels.
- Dedicated message bus — HTTP internal API only for 1.9.0.
- Email service embedding in iframe (redirect-only entry like Media library standalone).
- SMS or push notifications.

## Glossary

| Term | Definition |
|------|------------|
| **Transactional email** | System-triggered message (reset, verify, approval) — not marketing |
| **Platform template** | Default template owned by super admin; companies may override content |
| **Company override** | Company-scoped template body/subject replacing platform default for that company |
| **Branding** | Company name, logo URL, colors, contact, footer — merged into template render |
| **Queue item** | Pending send job with retry count, status (`pending`, `processing`, `sent`, `failed`) |
| **Internal send** | Server-to-server request from Identity/WebOnOne BE to Email BE |
| **Service API key** | Shared secret in each consumer `backend/.env` and Email `backend/.env` for internal routes |

## Success criteria

1. `npm run dev:email` serves Email UI at `:3004` and API at `:4004/health`.
2. Super admin sees all nav items; company admin sees company-scoped items; member sees dashboard-only or denied per spec in [02](./02-email-scaffold.md).
3. WebOnOne nav opens Email without re-login; direct Email origin shows Email nav.
4. Forgot-password flow sends mail with 1-hour link; verification mail with 24-hour link.
5. Company approval/rejection triggers correct templated email.
6. Queue retries failed sends; history records final status.
7. Provider credentials never appear in FE, logs, or consumer env files.
8. `npm run type-check -w email-root` passes; migrations apply cleanly.

## Subtask mapping (ClickUp)

| Subtask | ID | Spec section |
|---------|-----|----------------|
| Parent — Email microservice | 86ey30c9y | All |
| Email service repo scaffold | 86ey38567 | [02-email-scaffold.md](./02-email-scaffold.md) |
| Transactional email sending engine | 86ey38852 | [03-sending-engine.md](./03-sending-engine.md) |
| Email management screens | 86ey3887z | [04-management-screens.md](./04-management-screens.md) |
| Platform integrations and release readiness | 86ey388eg | [05-platform-integration.md](./05-platform-integration.md) |
