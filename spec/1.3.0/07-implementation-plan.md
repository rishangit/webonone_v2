# 07 — Implementation Plan

Phased delivery for **UI Kit 1.3.0** on branch **`feature/ui-kit-1.3.0-showcase`**.

---

## Branch workflow

```bash
git checkout master
git pull
git checkout -b feature/ui-kit-1.3.0-showcase   # created for this spec
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Feature branch | `feature/ui-kit-1.3.0-showcase` |
| Scope | `ui-kit/` + Identity auth/profile adoption + WebOnOne/Media consumer dialogs & lists |
| PR title | `feat(ui-kit): 1.3.0 tabbed showcase and form controls` |
| Merge strategy | Squash or merge commit per team preference; spec docs included in PR |

Commit spec files first (this folder), then implement in phases below.

---

## Phase 0 — Spec and scaffold (1–2 days) ✅

**Deliverables**

- [x] `spec/1.3.0/*` documentation
- [x] Branch `feature/ui-kit-1.3.0-showcase`
- [x] Showcase folder scaffold: `ThemeToolbar`, `DemoSection`, tab pages
- [x] Add Radix dependencies to `ui-kit/package/package.json` (including `@radix-ui/react-alert-dialog`)
- [x] `@radix-ui/react-tabs` in showcase workspace

**Exit criteria:** `npm run dev:ui-kit` opens app with four tabs + working theme toolbar.

---

## Phase 1 — Showcase restructure (2–3 days) ✅

**Goal:** Migrate existing demos without new components.

| Task | Source → Target |
|------|-----------------|
| Buttons, Forms, Feedback, Spinner, Toast | `ShowcaseHome` → `ControlsPage` / `ComponentsPage` |
| Dialog sizes + nested | → `DialogsPage` |
| Avatar, AppHeader, AppShell, Theming, Layout, Card | → `ComponentsPage` |
| Delete or thin `ShowcaseHome.tsx` | Default route → Controls tab |

**Exit criteria:** Parity with current showcase; four tabs + deep links; type-check passes.

---

## Phase 2 — Input composition (3–4 days) ✅

**Goal:** Icon variants and specialized text inputs.

| Component | Priority |
|-----------|----------|
| `InputGroup`, `InputGroupIcon`, `InputGroupText` | P0 |
| `PasswordInput` | P0 |
| `PhoneInput` | P1 |
| `Textarea` | P0 |

**Showcase:** All text/password/email/phone sections (with and without icons).

**Exit criteria:** FormField + error states work with InputGroup; theme tokens verified.

---

## Phase 3 — Choice controls (3–4 days) ✅

| Component | Priority |
|-----------|----------|
| `Checkbox` | P0 |
| `Switch` | P0 |
| `RadioGroup`, `RadioGroupItem` | P0 |
| `Select` (+ subcomponents) | P0 |
| `Slider` | P1 |

**Showcase:** Checkbox, switch, radio, select sections.

**Exit criteria:** Radix a11y (labels, keyboard); popover theming correct in dark mode.

---

## Phase 4 — Date and multi-select (4–5 days) ✅

| Component | Priority |
|-----------|----------|
| `DatePicker` + internal `Calendar` | P1 |
| `MultiSelect` | P1 |

**Showcase:** Date picker (with icon), multi-select (with icon) sections.

**Exit criteria:** Controlled/uncontrolled patterns documented in demo; no date lib dependency beyond native Date.

---

## Phase 5 — CustomDialog, AlertDialog, polish (3–4 days) ✅

Includes `nestedDismissGuard` for nested dialog dismiss fix and `Input`/`InputGroup` focus-ring alignment (`inGroup`, `ring-offset-0`).

| Task | Detail |
|------|--------|
| `CustomDialog.tsx` | Full shell API: `sizeWidth`, `sizeHeight`, `maxWidth`, header/body/footer, scroll rules |
| CustomDialog demos | Width presets, scroll, combinations table, form, delete, nested |
| `AlertDialog.tsx` | Strict non-dismissible confirms; optional delete demo |
| Button icon patterns | Document composition; optional `leftIcon`/`rightIcon` |
| Components tab refresh | Forms demo uses new controls; DropdownMenu standalone demo |
| Migrate showcase | Replace raw `Dialog` demos with `CustomDialog` where applicable |

**Exit criteria:** All sections in [01-overview.md](./01-overview.md) complete.

---

## Phase 6 — Verification and docs (1 day) ✅

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
npm run lint -w ui-kit-root
```

Manual QA matrix:

| Tab | Check |
|-----|-------|
| Controls | Every section × light/dark × default palette |
| Components | AppShell mobile width; toast; dropdown |
| Dialogs | CustomDialog presets, scroll, delete, nested; AlertDialog strict confirm |

Update `.cursor/rules/ui-kit-project.mdc` spec link to `spec/1.3.0` when shipped (optional follow-up).

---

## Phase 7 — Identity form adoption (1–2 days) ✅

**Goal:** Apply latest icon-enabled UI Kit controls to core Identity forms.

**Target pages/components**

| Area | File(s) |
|------|---------|
| Login | `identity/frontend/src/features/auth/pages/LoginPage.tsx`, `identity/frontend/src/features/auth/components/LoginForm.tsx` |
| Register | `identity/frontend/src/features/auth/pages/RegisterPage.tsx`, `identity/frontend/src/features/auth/components/RegisterForm.tsx` |
| Forgot password | `identity/frontend/src/features/auth/pages/ForgotPasswordPage.tsx`, `identity/frontend/src/features/auth/components/ForgotPasswordForm.tsx` |
| Edit profile | `identity/frontend/src/features/profile/pages/ProfilePage.tsx`, `identity/frontend/src/features/profile/components/ProfileForm.tsx` |

**Field-to-control mapping (required)**

| Form | Field | Current contract | 1.3.0 control target |
|------|-------|------------------|----------------------|
| Login | `email` | required, `autoComplete="email"` | `InputGroup` + leading mail icon + `Input type="email"` |
| Login | `password` | required, `autoComplete="current-password"` | `PasswordInput` (toggle on) |
| Register | `firstName`, `lastName` | required text fields | `Input` (no icon, two-column layout) |
| Register | `email` | required, `autoComplete="email"` | `InputGroup` + leading mail icon + `Input type="email" inGroup` |
| Register | `password` | required, `autoComplete="new-password"` | `PasswordInput` with `withIcon` |
| Forgot password | `email` | required, `autoComplete="email"` | `InputGroup` + leading mail icon + `Input type="email" inGroup` |
| Profile | `firstName`, `lastName`, `displayName` | required text fields | `InputGroup` + `User` icon + `Input inGroup` |
| Profile | `phoneNumber` | nullable E.164 string (`''` → `null` on submit) | `PhoneInput` with country selector; `formatPhoneE164` on submit, `parsePhoneE164` on load |
| Profile | `locale` | nullable string | `InputGroup` + `Globe` icon |
| Profile | address fields | nullable strings (`''` → `null`) | `InputGroup` + `MapPin` icon (autocomplete preserved) |
| Profile | `country` | nullable ISO-2 address code, uppercased on change | `InputGroup` + `Globe` icon (2-char behavior unchanged; **not** phone-country metadata) |

**Migration checklist**

- Replace legacy plain inputs with latest controls only for mapped fields above.
- Do **not** introduce new schema fields or new backend payload properties in Phase 7.
- Keep existing validation and API payload contracts unchanged (`phoneNumber`, `country`, etc.).
- Ensure required field markers, error rendering, disabled/loading states, and focus styles remain consistent.
- Keep auth flows standalone and service-local (no cross-service UI imports beyond `@webonone/ui-kit`).

**Non-regression invariants (mandatory)**

- Redirect-mode query propagation remains intact across auth pages (`redirect_uri`, `state`, return-path parameters in footer links and page transitions).
- Google sign-in block behavior remains unchanged on login/register pages (including hidden/disabled behavior when config is missing).
- Forgot password submitted/success states remain intact, including dev reset token rendering behavior.
- Profile normalization remains identical:
  - empty optional strings map to `null` on submit
  - `country` remains uppercase normalization behavior
  - no new transformations that alter existing backend semantics.

**Phone-country contract (Identity Profile)**

- Address `country` remains an address-country field and is **not** repurposed as phone-country persistence.
- Profile phone UI uses the full `PhoneInput` country selector for dial-code UX; stored value is **E.164** (`+<dial><national>`) via `formatPhoneE164`.
- Frontend validation: `phoneNumber` must match `/^\+\d{7,15}$/` when non-empty (`profileSchemas.ts`).
- `parsePhoneE164` uses `preferIso2: user.country` when splitting stored values for display.
- No separate `phoneCountry` backend field in 1.3.0.

**Exit criteria**

- Login/Register/Forgot Password/Profile forms use latest icon-ready controls with no behavior regressions.
- Identity frontend `type-check` and lint pass.
- Manual auth/profile happy-path verification succeeds.

---

## Phase 8 — Cross-service consumer adoption (parallel) ✅

Optional but shipped during 1.3.0 implementation:

| Service | Adoption |
|---------|----------|
| WebOnOne v2 | `CustomDialog` (theme CRUD, media picker), `ColorInput` in `ThemeForm`, `AlertDialog` in `ThemeDeleteDialog`, `nestedDismissGuard` on CSS import nested dialog |
| Media | `ItemList` in `FolderTree` / `MediaGrid`, `AlertDialog` in `MediaDeleteDialog` |

No backend contract changes required beyond Identity profile E.164 validation on the frontend (backend already accepts `phoneNumber` string).

---

## Risk and mitigations

| Risk | Mitigation |
|------|------------|
| DatePicker complexity | Ship styled native `input type="date"` in Phase 4 if calendar slips; replace in 1.3.1 |
| MultiSelect a11y | Start with Popover + Checkbox list; upgrade to cmdk later if needed |
| Bundle size from Radix | Tree-shake per primitive; audit `package.json` dependencies |
| Consumer breakage | Additive exports only; do not change `Input`/`Button` prop signatures |

---

## Estimated timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0 Scaffold | 1–2 d | ~2 d |
| 1 Restructure | 2–3 d | ~5 d |
| 2 Inputs | 3–4 d | ~9 d |
| 3 Choice controls | 3–4 d | ~13 d |
| 4 Date/multi | 4–5 d | ~18 d |
| 5 Polish | 3–4 d | ~20 d |
| 6 QA | 1 d | ~21 d |
| 7 Identity adoption | 1–2 d | ~23 d |
| 8 Consumer adoption | parallel | — |

**~4–5 weeks** one developer, or **~2–3 weeks** with parallel work (Phase 2 + consumer adoption).

---

## Acceptance checklist (release)

Copy into a PR(named) spec docs:

### Package

- [x] All new components exported from `ui-kit/package/src/index.ts`
- [x] `npm run build -w @webonone/ui-kit` succeeds from clean `dist/`
- [x] No hardcoded accent hex in components
- [x] Peer deps unchanged (`react`, `react-dom`)

### Showcase

- [x] Tabs: Controls, Components, Dialogs, Icons
- [x] ThemeToolbar sticky; affects all tabs (`@webonone/theme` `applyThemeVariables`)
- [x] Every demo section from [01-overview.md](./01-overview.md) present (+ ColorInput, Callout, ItemList)
- [x] `#controls`, `#components`, `#dialogs`, `#icons` deep links work

### Theme

- [x] [06-theme-token-coverage.md](./06-theme-token-coverage.md) checklist manually verified
- [x] Primary gradient updates when color1/color2 change
- [x] Focus rings and scrollbar use accent tokens

### Regression

- [x] Identity frontend auth/profile pages compile after control adoption
- [x] WebOnOne frontend compiles with `CustomDialog` / `ColorInput` / `AlertDialog`
- [x] Media frontend compiles with `ItemList` / `AlertDialog`
- [x] `CustomDialog` exported with `sizeWidth` / `sizeHeight` preset behavior per spec
- [x] Delete confirmation demo uses `CustomDialog` (`auto` + `max-w-md`) or `AlertDialog`
- [x] Existing low-level Dialog API unchanged (CustomDialog and AlertDialog are additive)
- [x] `nestedDismissGuard` documented for nested dialog dismiss fix

---

## Post-1.3.0 (future)

- Export `Tabs` from UI Kit if Identity/Media need tabbed settings
- Command/Combobox for searchable select
- `data-table` primitive
- Visual regression (Chromatic or Playwright screenshots)
- In-tab section index sidebar on Controls tab
