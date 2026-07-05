# 07 — Implementation Plan

Phased delivery for **1.11.2** on branch **`spec/1.11.2`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.11.2
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.11.2` |
| Scope | `data/frontend/`, `email/frontend/`, optional `packages/platform-nav/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.11.2/*` documentation
- [ ] Branch `spec/1.11.2`

---

## Phase 1 — Cross-satellite nav handlers

**Goal:** [02-cross-service-nav-fix.md](./02-cross-service-nav-fix.md)

| Task | Detail |
|------|--------|
| Data `emailConfig.ts` | Peer origin env + URL builder |
| Data `redirectToEmail.ts` | Auth-code redirect options (mirror WebOnOne) |
| Data `AppLayout.tsx` | `handleEmailNavClick` + sentinel `onClick` wiring |
| Email `dataConfig.ts` | Peer origin env + URL builder |
| Email `redirectToData.ts` | Auth-code redirect options |
| Email `AppLayout.tsx` | `handleDataNavClick` + sentinel `onClick` wiring |
| Env examples | `VITE_EMAIL_ORIGIN` on Data; `VITE_DATA_ORIGIN` on Email |

**Exit criteria:** Manual Data ↔ Email nav works; type-check both roots.

Spec: subtask **86ey5we2u**

---

## Fixes required (from bug subtask)

- [ ] Data → Email nav redirects to Email sub-route, not core Home
- [ ] Email → Data nav redirects to Data sub-route, not core Home
- [ ] Platform query params (`return_url`, `core_nav`, theme) preserved on peer hops

---

## Acceptance checklist

- [ ] Data `/tags` → Email Templates → Email `/templates`
- [ ] Email `/history` → Data Tags → Data `/tags`
- [ ] Core Home / Settings links still work from both satellites
- [ ] `npm run type-check -w data-root`
- [ ] `npm run type-check -w email-root`

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.11.2 Bug fixing | 86ey5wdua | All phases |
| Subtask: [Bug] issue in navigation with service | 86ey5we2u | Phase 1 |

---

## Final verification (build)

```bash
npm run type-check -w data-root
npm run type-check -w email-root
npm run lint -w data-root
npm run lint -w email-root
```
