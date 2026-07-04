# 07 — Implementation Plan

Phased delivery for **1.11.1** on branch **`spec/1.11.1`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.11.1
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.11.1` |
| Scope | `identity/`, `webonone-v2/`, `email/`, `data/`, `.cursor/rules/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.11.1/*` documentation
- [ ] Branch `spec/1.11.1`

---

## Phase 1 — Identity `users_roles` + API

**Goal:** Canonical role storage and assumable-roles API ([02-identity-user-roles.md](./02-identity-user-roles.md)).

| Task | Detail |
|------|--------|
| Migration | Create `users_roles` in Identity |
| Data migration | Copy rows from WebOnOne `users_roles` (script in migration or dedicated seed step) |
| Repository + service | Port from `webonone-v2/backend/src/repositories/userRole.repository.ts` |
| Routes | `GET /roles/me/assumable`, internal CRUD with API key |
| Seed | Move super-admin seed to Identity |
| Env | `SUPER_ADMIN_USER_ID`, `IDENTITY_SERVICE_API_KEY` in `.env.example` |

**Exit criteria:** `npm run migrate -w identity-root`; manual API test for assumable roles.

Spec: parent **86ey5n9zt**

---

## Phase 2 — JWT session role + re-issue

**Goal:** Session role in token ([04-jwt-session-role.md](./04-jwt-session-role.md)).

| Task | Detail |
|------|--------|
| Sign claims | Add `platform_role`, `company_id` to JWT payload on login when single role |
| `POST /auth/session-role` | Validate + re-issue token |
| Identity auth routes | Extend existing login/token paths |

**Exit criteria:** curl re-issue returns JWT with claims; type-check identity-root.

---

## Phase 3 — WebOnOne migration

**Goal:** Remove local `users_roles`; use Identity ([03-consumer-migration.md](./03-consumer-migration.md)).

| Task | Detail |
|------|--------|
| Identity client | `identityRoleClient.ts` for BE service calls |
| Company service | Role assign via Identity API |
| Remove assumable route | Frontend calls Identity API directly or proxy |
| Role dialog | Call Identity session-role re-issue |
| Migration | Drop `users_roles` from WebOnOne |
| Remove sync endpoints | `sync-email-role`, `sync-data-role` |
| Frontend | Remove `syncEmailRoleBeforeHandoff`, `syncDataRoleBeforeHandoff` |
| Middleware | Read role from JWT claims |

**Exit criteria:** Company registration + approval work; role dialog works; type-check webonone-v2-root.

---

## Phase 4 — Email + Data cleanup

**Goal:** JWT-only auth in satellites.

| Task | Detail |
|------|--------|
| Email migration | Drop `email_user_roles` |
| Email auth | JWT claims; delete `user.service.ts` |
| Data migration | Drop `data_user_roles` |
| Data auth | JWT claims; remove internal sync route |
| Rules | Update `email-project.mdc`, `webonone-v2-project.mdc` |

**Exit criteria:** `npm run type-check -w email-root` · `npm run type-check -w data-root`; Email/Data handoff without sync POST.

---

## Phase 5 — Rules and docs

| Task | Detail |
|------|--------|
| Identity rule/skill | Document `users_roles` ownership |
| `AGENTS.md` | Note Identity owns platform roles if needed |

**Exit criteria:** No stale references to consumer role tables in rules.

---

## Phase 6 — Remove Data FE `sync-data-role` calls (delta)

**Goal:** [05-fix-remove-sync-data-role.md](./05-fix-remove-sync-data-role.md).

| Task | Detail |
|------|--------|
| Delete | `data/frontend/src/features/auth/utils/syncPlatformDataRole.ts` |
| Auth callback | `AuthCallbackPage.tsx` — use `fetchDataRole` only |
| Platform bootstrap | `usePlatformSessionBootstrap.ts` — remove sync POST |
| Cleanup | Delete orphan `syncPlatformEmailRole.ts` / `syncEmailRole.ts` if unused |

**Exit criteria:** Data login/handoff without 404; `npm run type-check -w data-root`.

Spec: subtask **86ey5nk8m**

---

## Phase 7 — Platform SSO + longer session (delta)

**Goal:** [06-platform-sso-session.md](./06-platform-sso-session.md).

| Task | Detail |
|------|--------|
| Consumer login URLs | Remove default `prompt=login` from `buildIdentityLoginUrl` (WebOnOne, Data, Email, Media) |
| Login UX | Auto-redirect to Identity on consumer `LoginPage` mount |
| Identity env | `ACCESS_TOKEN_EXPIRY_SECONDS=604800` in `.env.example` |

**Exit criteria:** Cross-service login without re-entering credentials when Identity session exists.

Spec: subtask **86ey5nqjw**

---

## Acceptance checklist

- [ ] Identity `users_roles` populated; WebOnOne/Email/Data role tables absent
- [ ] Super-admin seed in Identity
- [ ] Multi-role user sees dialog; single-role auto-assigned
- [ ] Session role affects Email nav visibility (member hides Email)
- [ ] Data super-admin mutations require `platform_role: super_admin` in JWT
- [ ] No per-request Identity HTTP in consumer auth middleware
- [ ] `npm run type-check` passes on all four service roots

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.11.1 | 86ey5n9zt | All phases |
| Subtask: issue in data sync | 86ey5nk8m | Phase 6 |
| Subtask: login session need to increase | 86ey5nqjw | Phase 7 |

---

## Final verification (build)

```bash
npm run type-check -w identity-root
npm run type-check -w webonone-v2-root
npm run type-check -w email-root
npm run type-check -w data-root
npm run migrate -w identity-root
npm run migrate -w webonone-v2-root
npm run migrate -w email-root
npm run migrate -w data-root
```
