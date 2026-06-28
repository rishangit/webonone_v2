# 07 — Implementation Plan

Phased delivery for **1.8.0** on branch **`spec/1.8.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.8.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.8.0` |
| Scope | `ui-kit/`, `webonone-v2/frontend/`, `identity/frontend/`, `.cursor/rules/` |

---

## Phase 0 — Spec (this document)

- [x] `spec/1.8.0/*` documentation
- [x] Branch `spec/1.8.0`

---

## Phase 1 — UI Kit layout components

**Goal:** Export `PageHeader` and `FeaturePage`.

| Task | Detail |
|------|--------|
| Create `PageHeader.tsx` | Title, description, actions per [02-feature-page-layout.md](./02-feature-page-layout.md) |
| Create `FeaturePage.tsx` | Centered column, `gap-6`, configurable `maxWidth` |
| Export from `index.ts` | Types + components |
| Build package | `npm run build -w @webonone/ui-kit` |

**Exit criteria:** Components build and export.

---

## Phase 2 — Showcase demo

**Goal:** Document layout variants in showcase.

| Task | Detail |
|------|--------|
| Demo section | Default, narrow (`2xl`), header actions |
| Nav link | If new page, wire in `showcase-nav.ts` / `ShowcaseApp.tsx` |

**Exit criteria:** `npm run type-check -w ui-kit-root` passes.

---

## Phase 3 — WebOnOne v2 refactor

**Goal:** Migrate in-scope feature pages to `FeaturePage`.

| Task | Detail |
|------|--------|
| `HomePage` | Welcome copy in `FeaturePage` body |
| `BasicSettingsPage` | `maxWidth="2xl"` |
| `CompaniesPage` | Default layout |
| `SystemThemePage` | Normalize header; optional `actions` for create button |

**Exit criteria:** `npm run type-check -w webonone-v2-root` passes.

---

## Phase 4 — Cursor rule

**Goal:** Add `feature-page-layout.mdc` and index entry.

| Task | Detail |
|------|--------|
| Create rule | Per [03-cursor-rule.md](./03-cursor-rule.md) |
| Update rules README | Front-end table row |

**Exit criteria:** Rule file under 80 lines; verification commands listed.

---

## Phase 5 — Identity standalone navigation

**Goal:** `AppShell` left nav for Identity standalone; core return link when `return_url` present.

| Task | Detail |
|------|--------|
| Nav config | `identity/frontend/src/features/shell/config/navItems.ts` |
| AppLayout | `AppShell` for shell routes; `PageShell` for `/login` |
| ProfilePage | Remove inline back link |

**Exit criteria:** `npm run type-check -w identity-root` passes.

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec 1.8.0 | 86ey2ymnf | All phases |
| spaces and gaps | 86ey2ymt2 | 1–4 |
| need to have the left navigation for the identity service | 86ey33zeu | 5 |

---

## Acceptance checklist

- [ ] `PageHeader` and `FeaturePage` exported from `@webonone/ui-kit`
- [ ] Default column: `mx-auto w-full max-w-4xl`
- [ ] Header-to-body spacing: `gap-6`
- [ ] Title: `text-2xl font-semibold`; description: `text-sm text-muted-foreground`
- [ ] WebOnOne pages listed in [02](./02-feature-page-layout.md) use `FeaturePage`
- [ ] Showcase demonstrates layout variants
- [ ] `.cursor/rules/feature-page-layout.mdc` exists and is indexed
- [ ] Identity standalone nav: Profile, Register, Reset password ([04](./04-identity-navigation.md))
- [ ] Core redirect shows WebOnOne return nav item (no duplicate inline back button)
- [ ] `npm run build -w @webonone/ui-kit` succeeds
- [ ] `npm run type-check -w ui-kit-root` succeeds
- [ ] `npm run type-check -w webonone-v2-root` succeeds
- [ ] `npm run type-check -w identity-root` succeeds

---

## Fixes required

_None at spec time._

---

## Open items

_None at spec time._
