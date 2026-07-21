# 07 — Implementation Plan

Phased delivery for **1.12.3** on branch **`spec/1.12.3`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.12.3
```

| Rule | Detail |
|------|--------|
| Base branch | `master` (or current integration branch that includes 1.12.2 Email send/queue) |
| Spec branch | `spec/1.12.3` |
| Scope | `packages/platform-nav/`, `webonone-v2/frontend/`, `data/frontend/` (embed verify), Email/SMS/Identity FE path maps |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.12.3/*` documentation
- [ ] Branch `spec/1.12.3`

---

## Phase 1 — platform-nav Data catalog sentinels

**Goal:** Shared sentinels + six Data children ([02-webonone-data-catalog-nav.md](./02-webonone-data-catalog-nav.md)).

| Task | Detail |
|------|--------|
| `DATA_NAV_SENTINELS` | tags, units, attributes, products, services, spaces (drop core dashboard) |
| Helpers | Extend `isDataNavSentinel`, `dataSentinelToExternalPath` |
| Nav defs | Six children on Data group (main + superAdmin); remove Data Catalog |
| Exports | Confirm `packages/platform-nav/src/index.ts` |
| Tests | `coreNav.test.ts` — six URLs; member hides group; no dashboard child |

**Exit criteria:** Tests pass; package type-check / build ok.

---

## Phase 2 — WebOnOne + Data embed + satellites

**Goal:** Icons + default peer path; Data embed verify; Identity/Email/SMS rewrite maps.

| Task | Detail |
|------|--------|
| `PlatformPeerFrame` | Data default external path `/tags` |
| `navItems.ts` | Icons for six sentinels (Tag, Ruler, Shapes, Package, Wrench, Layers) |
| Data FE | Confirm six list routes under `PlatformEmbedLayout` + FeaturePage + content-ready |
| Identity | `dataHrefToSentinel` + icons for six paths |
| Email / SMS | `isDataNavSentinel` / parse helpers cover new sentinels |

**Exit criteria:** Manual: WebOnOne → each Data sub-item loads iframe; shell stays.

**Verify:** `npm run type-check -w webonone-v2-root` (+ data-root / identity-root / email-root / sms-root as touched)

---

## Acceptance checklist

- [ ] Super admin / company admin see Data group with Tags, Units, Attributes, Products, Services, Spaces (that order)
- [ ] Member does not see Data
- [ ] Core Data group does **not** include Dashboard / Data Catalog
- [ ] WebOnOne embed: each sub-item shows correct Data list page
- [ ] Sub-item switches do not unload WebOnOne shell
- [ ] Satellite → Data redirect lands on correct path
- [ ] Standalone Data nav unchanged (still includes Dashboard)
- [ ] `platform-nav` tests updated and green
- [ ] Type-check: platform-nav, webonone-v2-root, data-root, touched satellites

---

## ClickUp subtask traceability

| ClickUp | ID | Phase |
|---------|-----|-------|
| Parent: [User Story] Spec No 1.12.3 | TBD | All phases |
| Subtask: Data catalog left nav in WebOnOne | TBD | Phase 1–2 |

---

## Final verification

```bash
npm run type-check -w @webonone/platform-nav
npm run type-check -w webonone-v2-root
npm run type-check -w data-root
# plus identity-root / email-root / sms-root if Phase 2 touched them
```

Manual: `npm run dev:webonone` + `npm run dev:data` + `npm run dev:identity` — exercise all six Data nav children inside the shell.
