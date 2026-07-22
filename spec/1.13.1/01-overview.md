# 01 — Overview (1.13.1)

## Vision

A user authenticates into WebOnOne through Identity. Before the dashboard (or any role-aware shell) loads, WebOnOne asks **which account** to use for this session — but only when the user has more than one sensible choice. **Default User** is always available in that dialog and is **selected by default**. Users who are **Super Admin** see a Super Admin card. Users who **own companies** see one card per owned company. Users who are **only** Default User skip the dialog and go straight to the app.

## User story

As a WebOnOne user signing in, I want to choose whether to continue as Default User, as Super Admin (if I have that role), or as Company Owner for one of my companies, so the shell loads with the correct rights. If I have no companies and am not Super Admin, I should not see this step.

## Goals (1.13.1)

1. **Gate** — After login success, block the dashboard until account selection completes (or is skipped).
2. **Skip rule** — If the user has **only** Default User (no Super Admin, no owned companies), **do not** show the dialog; auto-continue as Default User.
3. **Dialog contents** — When shown, list **all** selectable accounts as cards in one dialog:
   - **Default User** (always) — **pre-selected**
   - **Super Admin** — if the user has the platform Super Admin role
   - **Owned companies** — one card per company the user owns (Company Owner / `company_admin`), pending or approved (not rejected)
4. **Confirm** — Continue reissues the session JWT for the chosen account (`POST` Identity `/auth/session-role`), then loads the shell.
5. **Non-dismissible** — User must Continue (or equivalent); no skip/dismiss without choosing.
6. **Preserve mid-session Login** — All Companies 3-dot Login from 1.13.0 remains for switching company after the session has started.

## Scope (1.13.1)

### In scope

- WebOnOne session bootstrap / `SessionRoleGate` / account selection dialog behavior
- `GET /company/me/assumable-roles` response shape used by the gate (Default User always present when multi-account; owned companies only; Super Admin when applicable)
- Labels and card copy (Default User, Super Admin, company name / Company Owner)
- Default selection = Default User when dialog opens

### Out of scope

- Changing Identity login / Google OAuth
- New Identity role enum values
- Inviting members / logging in as a non-owner member of a company from this dialog
- Header account switcher chrome (optional later; All Companies Login covers mid-session company switch)
- Changing company registration or approval flows (1.13.0)

## Glossary

| Term | Definition |
|------|------------|
| **Account (session)** | The platform role + optional `companyId` chosen for this WebOnOne session |
| **Default User** | `platformRole: member`, `companyId: null` — standard user shell |
| **Super Admin** | `platformRole: super_admin` — platform operator |
| **Owned company** | Company where Identity role is `company_admin` and status is `pending` or `approved` |
| **Choose account dialog** | Post-login `CustomDialog` listing selectable account cards |
| **Account selection gate** | Loading overlay / dialog until selectionComplete |

## Success criteria

1. User with only Default User: no dialog; dashboard loads as Default User.
2. User with ≥1 owned company: dialog lists Default User (pre-selected) + each owned company; Continue as Default User or a company works.
3. Super Admin (with or without companies): dialog includes Super Admin card; Default User still listed and pre-selected.
4. Rejected companies do not appear as owned-company cards.
5. Dashboard / role-aware nav does not render until Continue succeeds (or skip path completes).
6. Mid-session All Companies Login still works after selection.
7. `npm run type-check -w webonone-v2-root` passes.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — Spec No 1.13.1 | TBD | All docs |
| Subtask — Choose account dialog | TBD | [02](./02-account-selection-dialog.md), [03](./03-assumable-roles-for-selection.md) |
