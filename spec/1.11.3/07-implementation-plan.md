# 07 — Implementation Plan

Phased delivery for **1.11.3** on branch **`spec/1.11.3`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.11.3
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.11.3` |
| Scope | `packages/platform-embed/`, verify `identity/`, `webonone-v2/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.11.3/*` documentation
- [ ] Branch `spec/1.11.3`

---

## Phase 1 — Embed shell wheel scroll

**Goal:** [02-profile-embed-scroll-fix.md](./02-profile-embed-scroll-fix.md)

| Task | Detail |
|------|--------|
| `useEmbedMainWheelScroll.ts` | Wheel handler on embed main scroll root |
| `PlatformEmbedShell.tsx` | Wire ref + hook on `main.platform-embed-shell-main` |
| `index.ts` | Export hook if needed |

**Exit criteria:** Manual WebOnOne → Profile wheel scroll; type-check platform-embed + consumers.

Spec: parent **86ey61krq**

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.11.3 Profile scroll wheel | 86ey61krq | Phase 1 |

---

## Acceptance checklist

- [ ] WebOnOne `/profile` — mouse wheel scrolls profile content
- [ ] Scrollbar drag still works
- [ ] `npm run type-check -w @webonone/platform-embed` (or package script)
- [ ] `npm run type-check -w identity-root`
- [ ] `npm run type-check -w webonone-v2-root`
