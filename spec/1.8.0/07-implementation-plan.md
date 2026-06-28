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
| Scope | `ui-kit/`, `webonone-v2/frontend/`, `identity/frontend/`, `packages/platform-nav/`, `.cursor/rules/` |

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
| Create `FeaturePage.tsx` | Full-width column, `gap-6` per [02-feature-page-layout.md](./02-feature-page-layout.md) |
| Export from `index.ts` | Types + components |
| Build package | `npm run build -w @webonone/ui-kit` |

**Exit criteria:** Components build and export.

---

## Phase 2 — Showcase demo

**Goal:** Document layout variants in showcase.

| Task | Detail |
|------|--------|
| Demo section | Default layout + header actions |
| Nav link | If new page, wire in `showcase-nav.ts` / `ShowcaseApp.tsx` |

**Exit criteria:** `npm run type-check -w ui-kit-root` passes.

---

## Phase 3 — WebOnOne v2 refactor

**Goal:** Migrate in-scope feature pages to `FeaturePage`.

| Task | Detail |
|------|--------|
| `HomePage` | Welcome copy in `FeaturePage` body |
| `BasicSettingsPage` | `FeaturePage` wrapper; narrow form inside body if needed |
| `CompaniesPage` | Default full-width layout |
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

## Phase 5 — Identity dual navigation

**Goal:** Mutually exclusive sidebars — Identity nav (standalone) or full core nav (redirect).

| Task | Detail |
|------|--------|
| `coreNav.ts` | `packages/platform-nav/src/coreNav.ts` — shared path trees + URL resolver |
| WebOnOne nav | Refactor `navItems.ts` from shared paths; pass `core_nav` on profile redirect |
| Identity nav | `buildStandaloneNav()`, `buildCoreNavFromQuery()` in `navItems.ts` |
| AppLayout | Switch nav + logo by `return_url`; `AppShell` for shell routes |
| ProfilePage | Remove inline back link |

**Exit criteria:** `npm run build -w @webonone/platform-nav`; `npm run type-check -w identity-root` passes.

---

## Phase 6 — Identity standalone welcome / login

**Goal:** Standalone `/login` shows welcome page with Identity sidebar; redirect/embed login unchanged.

| Task | Detail |
|------|--------|
| Standalone nav | Add **Home** item → `/login` in `navItems.ts` |
| Shell routes | Include `/login` in `IDENTITY_SHELL_ROUTES`; `AppLayout` skips shell on redirect-mode login |
| LoginPage | Standalone: `FeaturePage` welcome + sign-in body; redirect: existing `AuthLayout` in `PageShell` |

**Exit criteria:** `npm run type-check -w identity-root` passes; manual check at `:3001/login` shows sidebar + welcome header.

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec 1.8.0 | 86ey2ymnf | All phases |
| spaces and gaps | 86ey2ymt2 | 1–4 |
| need to have the left navigation for the identity service | 86ey33zeu | 5 |
| identity project stand alone loggin need to have the welcome page | 86ey342mv | 6 |

---

## Acceptance checklist

- [ ] `PageHeader` and `FeaturePage` exported from `@webonone/ui-kit`
- [ ] Feature pages use full shell main width (`w-full`); header-to-body spacing: `gap-6`
- [ ] Title: `text-2xl font-semibold`; description: `text-sm text-muted-foreground`
- [ ] WebOnOne pages listed in [02](./02-feature-page-layout.md) use `FeaturePage`
- [ ] Showcase demonstrates layout variants
- [ ] `.cursor/rules/feature-page-layout.mdc` exists and is indexed
- [ ] Identity standalone: Home (welcome/login), Profile, Register, Reset password nav only ([04](./04-identity-navigation.md))
- [ ] Standalone `/login` uses `FeaturePage` welcome header + sign-in body inside `AppShell`
- [ ] Core redirect: full WebOnOne nav only (Home + Settings; Companies for super admin via `core_nav`)
- [ ] Shared nav paths in `@webonone/platform-nav` (`coreNav.ts`)
- [ ] `npm run build -w @webonone/ui-kit` succeeds
- [ ] `npm run build -w @webonone/platform-nav` succeeds
- [ ] `npm run type-check -w ui-kit-root` succeeds
- [ ] `npm run type-check -w webonone-v2-root` succeeds
- [ ] `npm run type-check -w identity-root` succeeds

---

## Fixes required

_None at spec time._

---

## Open items

_None at spec time._
