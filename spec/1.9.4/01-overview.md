# 01 — Overview (1.9.4)

## Vision

After Identity login, a WebOnOne user may hold more than one platform role — for example **super admin** plus **company admin** on their registered company. They should choose which hat to wear **once per login session** so the shell, settings, and Email satellite show the correct menus and permissions until logout.

Users with **no company membership** skip the dialog and land in the **default user** experience (no Email menu).

## User story

As a user, I want to log in and select my role — super admin, company admin, or default user — so that I see the correct interface and permissions based on my role.

## Goals (1.9.4)

1. **Session role state** — store `activeSessionRole` in frontend memory (Redux) for the login session; clear on logout.
2. **Assumable roles API** — `GET /api/v1/company/me/assumable-roles` returns roles the user may pick from `users_roles`.
3. **Role selection dialog** — `CustomDialog` shown after auth when user has company membership and **two or more** assumable roles; single-role users auto-assign without dialog.
4. **Super admin session** — Companies nav + system-scoped Email (history + templates).
5. **Company admin session** — no Companies nav; company-scoped Email (history + templates).
6. **Default user session** — Home + Settings only; **Email group hidden** in WebOnOne shell.
7. **Email sync** — `POST /company/me/sync-email-role` accepts optional session role hint or reads server-side session cache; syncs `email_user_roles` before auth-code handoff.
8. **Once per session** — dialog does not reappear on in-app navigation; only after fresh login.

## Scope (1.9.4)

### In scope

- WebOnOne frontend: role slice, dialog component, `AppLayout` nav variant from session role.
- WebOnOne backend: assumable roles endpoint; session-aware email role sync.
- `@webonone/platform-nav`: `companyAdmin` variant; `member` variant without Email group.
- Route guard on `/companies` — super-admin session only.
- Identity profile handoff passes `core_nav` matching session role.

### Out of scope (1.9.4)

- Persisting role choice across browser tabs beyond Redux (no localStorage).
- Multi-company picker when user has roles in several companies (use primary company from [1.9.3](../1.9.3/05-webonone-users-roles.md) `getMyCompany` rule).
- Role switching mid-session without logout (future enhancement).
- Email UI changes beyond existing role-based filters.
- New UI Kit export (dialog uses existing `CustomDialog`).

## Glossary

| Term | Definition |
|------|------------|
| **Assumable role** | One of `super_admin`, `company_admin`, `member` the user holds in `users_roles` and may activate for the session |
| **Session role** | The role chosen (or auto-assigned) for the current login session |
| **Default user** | Session role `member` — standard user permissions; Email menu hidden in WebOnOne |
| **Primary company** | Company row selected by existing `getMyCompany` when multiple company roles exist |

## Success criteria

1. User with company + super_admin sees role dialog after login with applicable options.
2. Choosing **super admin** shows Companies + Email; Email sync uses `super_admin`.
3. Choosing **company admin** hides Companies; Email sync uses `company_admin` + primary `company_id`.
4. Choosing **default user** hides Email nav group entirely.
5. Dialog appears at most once per session; logout clears choice.
6. User without company membership sees no dialog and gets default user nav (no Email).
7. `npm run type-check -w webonone-v2-root` passes; platform-nav builds.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — session role selection | 86ey41tfh | All docs |

### Acceptance criteria (from ClickUp parent)

1. After login, if the user is part of a company, a pop-up prompts role selection (super admin, company admin, or default user).
2. **Super admin** — super-admin permission interface; system email history and template access.
3. **Company admin** — company-admin interface; company email history and template access.
4. **Default user** — standard permissions; no Email menu in WebOnOne shell.
5. Role selection pop-up once per login session; choice persists until logout.
6. Role remembered until logout or account switch.
7. If user does not belong to a company, no pop-up; proceed as default user.
