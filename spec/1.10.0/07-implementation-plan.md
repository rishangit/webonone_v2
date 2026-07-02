# 07 — Implementation Plan

Phased delivery for **1.10.0** on branch **`spec/1.10.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.10.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.10.0` |
| Scope | `webonone-v2/frontend`, `identity/frontend`, `email/frontend`, `media/frontend` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.10.0/*` documentation
- [ ] Branch `spec/1.10.0`

---

## Phase 1 — WebOnOne v2 (largest reference app)

**Goal:** Prove pattern on WebOnOne; largest baseline chunk ([02-frontend-chunk-splitting.md](./02-frontend-chunk-splitting.md)).

| Task | Detail |
|------|--------|
| `router.tsx` | `React.lazy` for `HomePage`, `CompaniesPage`, `BasicSettingsPage`, `SystemThemePage` |
| `vite.config.ts` | `build.rollupOptions.output.manualChunks` |
| Loading UI | `Suspense` fallback using UI Kit loader |

**Exit criteria:** `npm run build -w webonone-v2-root` — no >500 kB chunk warning.

Spec: parent **86ey4yz5q**

---

## Phase 2 — Identity frontend

**Goal:** Same pattern on auth service SPA.

| Task | Detail |
|------|--------|
| Router lazy routes | Profile and secondary auth pages |
| `vite.config.ts` | Copy manualChunks strategy from Phase 1 |

**Exit criteria:** Build clean; login + profile smoke in dev.

---

## Phase 3 — Email frontend

**Goal:** Split dashboard and management routes.

| Task | Detail |
|------|--------|
| Router lazy routes | Templates, history, queue, settings pages |
| `vite.config.ts` | manualChunks |

**Exit criteria:** Build clean; auth-code handoff + dashboard load.

---

## Phase 4 — Media frontend

**Goal:** Split library/picker/upload routes.

| Task | Detail |
|------|--------|
| Router lazy routes | Feature pages outside embed-critical paths |
| `vite.config.ts` | manualChunks |

**Exit criteria:** Build clean; picker embed still works from WebOnOne.

---

## Phase 5 — Verification

| Task | Detail |
|------|--------|
| Build all four | No Rollup 500 kB warnings |
| Type-check | Each service root |
| Manual | Cold load + navigate each lazy route per service |

**Exit criteria:** Acceptance checklist below passes.

---

## Phase 6 — Cursor rules

**Goal:** Document pattern for future agents ([03-cursor-rules.md](./03-cursor-rules.md)).

| Task | Detail |
|------|--------|
| New rule | `.cursor/rules/frontend-vite-chunk-splitting.mdc` |
| Index | `.cursor/rules/README.md` entry |

**Exit criteria:** Rule lists lazy-route pattern, `manualChunks`, eager exceptions, verification command.

Spec: subtask **86ey50q2u**

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.10.0 | 86ey4yz5q | Phases 1–5 |
| Subtask: update the rules | 86ey50q2u | Phase 6 |

---

## Acceptance checklist

- [ ] WebOnOne build: no chunk > 500 kB warning; lazy routes work with guards
- [ ] Identity build: no chunk > 500 kB warning; login/profile flows work
- [ ] Email build: no chunk > 500 kB warning; dashboard and templates reachable
- [ ] Media build: no chunk > 500 kB warning; picker/upload embed paths work
- [ ] `manualChunks` present in all four `frontend/vite.config.ts`
- [ ] `chunkSizeWarningLimit` not raised unless documented exception
- [ ] `npm run type-check` passes for all four service roots
- [ ] `.cursor/rules/frontend-vite-chunk-splitting.mdc` exists and is indexed

---

## Final verification commands

```bash
npm run build -w webonone-v2-root
npm run build -w identity-root
npm run build -w email-root
npm run build -w media-root
npm run type-check -w webonone-v2-root
npm run type-check -w identity-root
npm run type-check -w email-root
npm run type-check -w media-root
```
