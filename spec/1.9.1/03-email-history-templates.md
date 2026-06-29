# 03 — Email History and Templates (1.9.1)

Role-scoped **History** and **Templates** admin in the Email service, plus the **password_reset_otp** system template. Implements requirements from ClickUp parent **86ey3hef6**.

## Navigation

When a user opens the Email service (from WebOnOne core nav or direct Email origin), authenticated **super_admin** and **company_admin** users see service nav items including:

| Nav label | Route | Super admin | Company admin |
|-----------|-------|-------------|---------------|
| **History** | `/history` | All send history (platform + all companies) | Rows where `company_id` matches admin's company |
| **Templates** | `/templates` | Platform (`scope=platform`) system templates | Company templates (`scope=company`, own `company_id`) |

Existing routes from [1.9.0/04-management-screens.md](../1.9.0/04-management-screens.md) — 1.9.1 **tightens scope rules** and adds OTP template; no new top-level routes required unless labels are grouped under an "Email" section in core platform nav (consumer handoff unchanged).

**Super admin** must be able to **edit** system templates (including OTP template) from Templates list → editor.

**Company admin** must **not** see or edit platform-only system templates; only company-scoped template overrides/lists.

## Template: `password_reset_otp`

### Seed content (platform default)

**Name:** Password reset OTP

**Slug:** `password_reset_otp`

**Scope:** `platform` (system email)

**Subject:** Your password reset code

**Text body example:**

```text
Dear {{userName}}

We received a request to reset your password.

Your verification code is: {{otp}}

This code expires in 1 minute. If you did not request this, ignore this email.

{{footerHtml}}
```

**HTML body:** Equivalent HTML with `{{userName}}`, `{{otp}}`, branding placeholders per [1.9.0/03-sending-engine.md](../1.9.0/03-sending-engine.md).

### Placeholders

| Key | Source | Required |
|-----|--------|----------|
| `userName` | Identity payload | Yes |
| `otp` | Identity payload (4 digits) | Yes |
| `year`, `footerHtml`, branding keys | Render pipeline | Optional |

Super admin edits **template name** and **content** (subject + HTML + text) in Template editor; saves create version row.

### Dynamic values

Rendering uses `{{key}}` replacement at send time — same engine as 1.9.0. Identity passes `userName` and `otp` in internal send payload.

## History list

### Super admin

- `GET /api/v1/history` — no `company_id` filter; paginated all rows.
- Filters: status, date range, template slug (including `password_reset_otp`).

### Company admin

- `GET /api/v1/history` — server enforces `company_id = jwt.companyId` (or role copy).
- Password reset OTP sends are **system** (`company_id` null) — company admin **does not** see OTP reset emails in 1.9.1 (platform-only transactional). Document in UI empty state if needed.

### Row fields

Recipient, template slug/name, status, sent_at, error snippet (existing History page).

Use **ItemList** skill for rows per [1.9.0/04-management-screens.md](../1.9.0/04-management-screens.md).

## Templates list

### Super admin

- Lists all `scope=platform` templates.
- Actions: Edit, Preview, Activate/Deactivate, Version history.
- Must include `password_reset_otp` after migration/seed.

### Company admin

- Lists `scope=company` templates for their company only.
- Cannot edit `password_reset_otp` (platform system template).

## API enforcement

Backend middleware on `GET/PUT /api/v1/templates*` and `GET /api/v1/history`:

| Role | Templates read/write | History read |
|------|---------------------|--------------|
| `super_admin` | Platform + all companies | All |
| `company_admin` | Own company scope only | Own `company_id` only |
| `member` | Denied (except dashboard) | Denied |

Align with existing `email_user_roles` copy from JWT.

## Migration / seed

Add to `email/backend/migrations/` or seed script:

- Insert `password_reset_otp` platform template if not exists.
- Optional: mark legacy `password_reset` inactive for new installs (product decision).

## Acceptance

- [ ] `password_reset_otp` template seeded and editable by super admin
- [ ] Super admin history shows OTP reset sends
- [ ] Company admin history excludes other companies' mail
- [ ] Company admin templates list excludes platform system templates
- [ ] Template preview renders `{{userName}}` and `{{otp}}` with sample data
- [ ] Placeholder help in editor documents required keys
