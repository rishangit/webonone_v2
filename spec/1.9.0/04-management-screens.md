# 04 — Email management screens (1.9.0)

Administrator UI for day-to-day email operations. Implements ClickUp subtask **86ey3887z**.

All pages use `@webonone/ui-kit` **`FeaturePage`** + **`PageHeader`** per [feature-page-layout.mdc](../../.cursor/rules/feature-page-layout.mdc).

## Route map

| Route | Page | Roles |
|-------|------|-------|
| `/` | DashboardPage | authenticated |
| `/send` | SendEmailPage | super_admin, company_admin |
| `/templates` | TemplatesPage | super_admin, company_admin |
| `/templates/:id` | TemplateEditorPage | super_admin, company_admin |
| `/templates/:id/preview` | TemplatePreviewPage | super_admin, company_admin |
| `/history` | HistoryPage | super_admin, company_admin |
| `/queue` | QueuePage | super_admin, company_admin |
| `/test` | TestEmailPage | super_admin, company_admin |
| `/providers` | ProvidersPage | super_admin |
| `/settings` | SettingsPage | super_admin (global), company_admin (branding tab) |

## Dashboard

- Recent send activity (last 10 from history) — company-scoped for company admin.
- Summary cards: queue pending count, failed count (24h), sent count (24h).
- Role-appropriate empty states.

## Send Email

Manual one-off send form:

- Fields: recipient email, template select (scoped), dynamic placeholder fields based on template.
- Preview button; Confirm send → `POST /api/v1/send`.
- Inline validation via Zod + `FormField` (form-creation skill).

## Templates

List (`ItemList` skill):

- Columns: name, slug, scope (platform/company), active status, updated.
- Actions: Edit, Preview, Activate/Deactivate, Version history, Restore default (company override).

**Template editor:**

- Subject, HTML body (textarea or simple editor for 1.9.0), plain text body.
- Placeholder help text listing allowed keys.
- Save creates version row in `email_template_versions`.

**Preview:**

- Render with sample payload + branding; show HTML iframe or sanitized preview panel.

**Version history:**

- List versions with timestamp; Restore loads version into editor or reactivates.

## History

Paginated list of sent/failed messages:

- Filter by status, date range, template slug.
- Company admin: auto-filter `company_id`.
- Row: recipient, template, status, sent_at, error snippet.

## Queue

Live queue status:

- Pending / processing / failed tabs.
- Retry action for failed (super_admin) → re-queue item.
- Auto-refresh optional (30s poll).

## Test Email

- Select template + recipient (default: current user email).
- Send test via `POST /api/v1/send/test`.
- Success/error toast.

## Providers (super admin)

- Display SMTP host, port, from address (from env/non-secret store).
- Connection status indicator.
- **Test connection** button.

No password field on screen — document that secrets live in server env.

## Settings

**Super admin tab:** global defaults (from name override if stored in DB), audit log link.

**Company admin tab — Branding:**

- Company name, logo URL, primary color, contact email, footer HTML.
- Live preview panel.
- Save → `PUT /api/v1/branding/:companyId`.

## API summary (FE consumption)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/dashboard/stats` | Dashboard cards |
| GET | `/api/v1/templates` | List templates |
| GET/PUT | `/api/v1/templates/:id` | CRUD |
| GET | `/api/v1/templates/:id/versions` | Version list |
| POST | `/api/v1/templates/:id/restore` | Restore version |
| POST | `/api/v1/templates/:id/preview` | Render preview |
| GET | `/api/v1/history` | Paginated history |
| GET | `/api/v1/queue` | Queue items |
| POST | `/api/v1/queue/:id/retry` | Retry failed |
| GET/PUT | `/api/v1/branding/:companyId` | Branding |
| GET | `/api/v1/providers` | Provider info |
| POST | `/api/v1/providers/test` | SMTP test |

## Acceptance (subtask 3)

- [ ] Super admin manages platform templates, providers, global settings
- [ ] Company admin manages company templates, branding, test, scoped history/queue
- [ ] Dashboard shows role-appropriate summaries
- [ ] Template edit, preview, activate/deactivate, version restore
- [ ] Manual send and test send work from UI
- [ ] Queue and history visible without backend/DB access
