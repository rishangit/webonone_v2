# 01 — Overview (1.3.0)

## Vision

The UI Kit becomes the **single source of truth** for polished, accessible form controls and app chrome. The showcase app reorganizes into **Controls**, **Components**, **Dialogs**, and **Icons** tabs so designers and developers can find every primitive quickly, verify variants (with/without icons, disabled, error states), and confirm that **System Theme accents** apply consistently.

## Goals (1.3.0)

1. **Tabbed showcase** — top-level navigation: Controls | Components | Dialogs | Icons; sticky theme toolbar on all tabs.
2. **Complete control library** — buttons (with icons), text/password/email/phone inputs (plain + icon), date picker, select, multi-select, checkbox, switch, radio, textarea, slider.
3. **High UI quality** — Radix primitives, consistent height/spacing, focus rings, disabled states, error styling via `FormField`; mobile-first responsive demos.
4. **Theme-aware everything** — every new control uses semantic Tailwind tokens (`primary`, `ring`, `border`, `input`, `destructive`, etc.); showcase toggles light/dark + sample accent palette to prove propagation.
5. **No consumer breakage** — existing exports keep stable APIs; new components are additive; optional migration guides for Identity/WebOnOne when they adopt new inputs.

## Scope (1.3.0)

### In scope

- New components and patterns in `ui-kit/package/src/components/`.
- Showcase refactor: tab shell + one demo section per control/component.
- **`CustomDialog`** — primary Radix wrapper with `sizeWidth` / `sizeHeight` presets, header/body/footer shell, footer-only actions; replaces raw Dialog composition in feature code.
- **`AlertDialog`** — Radix alert dialog for strict non-dismissible confirms (optional complement to `CustomDialog` delete).
- Radix dependencies: `@radix-ui/react-checkbox`, `@radix-ui/react-switch`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-popover`, `@radix-ui/react-slider`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-tabs` (showcase only if not exported).
- `InputGroup` / `InputIcon` composition for leading/trailing icons.
- Phone input: formatted tel input with optional country selector backed by static ISO+E.164 data (no runtime country-data dependency for consumers). Exported helpers: `formatPhoneE164`, `parsePhoneE164`.
- `ColorInput`: hex text field + native color swatch inside `InputGroup`.
- `Callout` + `ItemList` composites (glass-card rows, per-item overflow menu).
- Date picker: `Popover` + calendar grid (native `input type="date"` fallback demo + styled calendar variant).
- Multi-select: Radix-based or Combobox pattern with chip display.
- Theme token table for all controls (see [06-theme-token-coverage.md](./06-theme-token-coverage.md)).

### Out of scope (1.3.0)

- Domain-specific forms (login, theme editor, media upload) — stay in service frontends.
- Backend or API changes.
- Replacing `@webonone/theme` propagation model.
- Rich text editor, file upload dropzone, data table, charts.
- Automatic contrast checker in theme form (deferred).
- Consumer-wide migration forcing all services to new inputs in one release.

## Glossary

| Term | Definition |
|------|------------|
| **Control** | Atomic form element: Button, Input, Checkbox, etc. |
| **Composite component** | Composition of controls + layout: Form demo, AppShell, Card grid |
| **InputGroup** | Wrapper placing icon(s) inside or beside an input with shared focus ring |
| **Showcase tab** | Top-level Controls / Components / Dialogs / Icons view in the demo app |
| **Demo section** | One titled block within a tab (e.g. "Password (with icon)") |
| **Theme toolbar** | Sticky strip: light/dark toggle + palette swatches + primary button sample |

## Success criteria

1. Showcase runs at `:3002` with four tabs; every listed demo section exists and is navigable (in-tab anchor nav optional).
2. All controls in [03-form-controls.md](./03-form-controls.md) are exported from `@webonone/ui-kit` (except showcase-only layout helpers).
3. Toggling light/dark and changing accent swatches in the theme toolbar updates **all** visible controls on the current tab without reload.
4. `npm run build -w @webonone/ui-kit` and `npm run type-check -w ui-kit-root` pass.
5. No hardcoded accent hex in component source — tokens only.
6. Existing Identity/WebOnOne imports of `Button`, `Input`, `Dialog`, `AppShell` continue to compile without changes; new code should prefer `CustomDialog`.

## Reference: showcase tab inventory

### Tab: Controls

| Section | Status (baseline) |
|---------|-------------------|
| Buttons | Exists — extend with icon variants |
| Buttons with icons | **New** |
| Input text | Exists |
| Input text (with icon) | **New** |
| Password | **New** (`type="password"` + toggle) |
| Password (with icon) | **New** |
| Email text | **New** (semantic + validation demo) |
| Email text (with icon) | **New** |
| Color picker | **New** (`ColorInput`) |
| Color picker (disabled) | **New** |
| Phone input | **New** |
| Phone input (with country) | **New** |
| Phone input (with icon) | **New** |
| Date picker | **New** |
| Date picker (with icon) | **New** |
| Select option | **New** |
| Select option (with icon) | **New** |
| Multi select option | **New** |
| Multi select option (with icon) | **New** |
| Checkbox | **New** |
| Switch | **New** |
| Radio option | **New** |
| Text area | **New** |
| Slider | **New** |

### Tab: Components

| Section | Status (baseline) |
|---------|-------------------|
| Forms | Exists — expand with new controls |
| Feedback | Exists (Alert) |
| Callout | **New** — highlighted panel with optional action |
| Loadings | Exists (Spinner) |
| Toast | Exists |
| 3-dot menu | Exists (DropdownMenu) — dedicated demo |
| Item lists | **New** — `ItemList` glass-card rows + `ItemListMenu` |
| Avatars | Exists |
| App header | Exists |
| App shell | Exists |
| Theming | Exists — move to toolbar + keep summary section |
| Layout | Exists — AuthLayout, PageShell |
| Cards | Exists — expand variants |

### Tab: Icons

| Section | Status |
|---------|--------|
| Icon library overview | **New** |
| Actions | **New** |
| Navigation | **New** |
| Form & input | **New** |
| Selection | **New** |
| Media | **New** |
| App chrome | **New** |

See [08-icons.md](./08-icons.md).

### Tab: Dialogs

| Section | Status (baseline) |
|---------|-------------------|
| **CustomDialog** — width presets | **New** component + demo |
| **CustomDialog** — height + scroll | **New** demo |
| **CustomDialog** — common size combinations | **New** demo |
| **CustomDialog** — form dialog | **New** demo |
| **CustomDialog** — delete confirmation | **New** demo (`sizeWidth="auto"`, `maxWidth="max-w-md"`) |
| **CustomDialog** — nested | **New** demo |
| **AlertDialog** — strict confirm + delete | **New** component + demo (optional non-dismissible) |
| Theme sensitivity | **New** demo |
| Legacy `Dialog` sm–2xl gallery | Migrate to CustomDialog presets; keep primitives exported |
