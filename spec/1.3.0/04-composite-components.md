# 04 — Composite Components (Components tab)

Demos for layouts, feedback, navigation chrome, and compositions built from controls. Most exports **already exist** from 1.2.0; 1.3.0 reorganizes showcase sections and fills gaps.

See [03-form-controls.md](./03-form-controls.md) for atomic inputs used inside these demos.

---

## Section: Forms

**Purpose:** End-to-end form patterns with Zod validation (matches [form-creation skill](../../.cursor/skills/form-creation/SKILL.md)).

### Demo content

| Example | Controls used |
|---------|---------------|
| Registration-style form | Text, email (with icon), password (with icon), phone, checkbox (terms), submit button |
| Settings snippet | Switch, select, textarea |
| Inline validation | `mapZodIssuesToFieldErrors` + `FormField` errors |

Extend current `ShowcaseFormDemo` to use new controls where available; keep submit → Zod → inline errors flow.

### Acceptance

- Required fields show asterisk via `FormField required`.
- Error messages appear under the field, not only toast.

---

## Section: Feedback

| Component | Demo |
|-----------|------|
| `Alert` | Default + `variant="destructive"` |
| `Alert` with title only | Minimal variant |

Optional future: `Alert` variants `success`, `warning` if added — out of scope unless trivial token mapping.

---

## Section: Callout

| Export | Demo |
|--------|------|
| `Callout`, `CalloutTitle`, `CalloutDescription`, `CalloutAction` | Default + `variant="muted"` |

Showcase: CColorPalette import tip with action button; muted variant for lower-emphasis tips.

---

## Section: Loadings

| Component | Demo |
|-----------|------|
| `Spinner` | `sm`, `md`, `lg` inline |
| Button loading state | `Button disabled` + `Spinner` as child (pattern doc, not new export) |
| Full-page overlay | Showcase-only composition: semi-transparent `bg-background/80` + centered spinner |

---

## Section: Toast

Use existing `useToast` + `ToastProvider` (wrap showcase app root if not already).

| Demo | Action |
|------|--------|
| Default toast | Title + description |
| Destructive toast | Error styling if supported |
| Action toast | Optional — defer if API unchanged |

---

## Section: 3-dot menu

Dedicated **DropdownMenu** demo (currently only used inside AppHeader).

| Demo | Contents |
|------|----------|
| Basic menu | Edit, Duplicate, Delete (destructive item) |
| With shortcuts | `DropdownMenuShortcut` |
| Checkbox items | Toggle columns |
| Radio group | Sort order |
| Submenu | Nested `DropdownMenuSub` |

Tokens: `bg-popover`, `border-border`, destructive item `text-destructive focus:text-destructive` (optional enhancement: `focus:bg-destructive/10`).

Uses **`MoreVertical`** (not `MoreHorizontal`) for overflow triggers — matches `ItemListMenu`.

---

## Section: Item lists

| Export | Demo |
|--------|------|
| `ItemList`, `ItemListItem`, `ItemListContent`, `ItemListMenu`, `ItemListEmpty` | Theme rows with per-row 3-dot menu + empty state |

Pattern: small gap between rows, `glass-card` row surfaces, themed shadow on hover, active row via `itemListRowActiveClassName`.

Used in showcase Components tab and Media `FolderTree` / `MediaGrid` empty state.

---

## Section: Avatars

| Demo | Contents |
|------|----------|
| Sizes | `xs` through `xl` with fallback initials |
| With image | `src` + fallback |
| Group stack | Showcase composition (negative margin overlap) |

---

## Section: App header

| Demo | Contents |
|------|----------|
| Guest | Logo only |
| Authenticated | User menu, profile + logout callbacks |
| Mobile | `showMenuButton`, `onMenuClick`, `menuOpen` hamburger |

---

## Section: App shell

Migrate existing `AppShell` demo from `ShowcaseHome`:

- Collapsible sidebar
- Settings `NavGroup` with nested item
- Narrow container simulating mobile
- Main content with `scrollbar-themed`

Optional: `defaultCollapsed` toggle in demo controls.

---

## Section: Theming

**Split responsibility with ThemeToolbar** (see [02-showcase-tabbed-navigation.md](./02-showcase-tabbed-navigation.md)):

| In ThemeToolbar (global) | In Theming section (this tab) |
|--------------------------|-------------------------------|
| Light/dark toggle | Explanation of token roles |
| Live swatches | Table: color1–color5 → CSS vars |
| Sample buttons | Before/after screenshots or side-by-side solid vs gradient |

Include scrollable panel demo for `scrollbar-themed` (from 1.2.0).

---

## Section: Layout

| Demo | Component |
|------|-----------|
| Page shell | `PageShell` — simple centered layout (auth-adjacent pages) |
| Auth layout | `AuthLayout` variants `default`, `minimal` |
| Brand | `BrandLogo` if exported — optional row |

Grid: two-column on `md+` showing PageShell vs AuthLayout side by side.

---

## Section: Cards

Extend Card demos beyond single static card:

| Demo | Description |
|------|-------------|
| Basic | Header + content |
| With footer | `CardFooter` actions |
| Interactive | Hover border `border-primary/50` (showcase class only) |
| Stat card | Title, large metric, muted caption (composition) |

Tokens: `bg-card`, `border-border`, title `text-foreground`, accent title variant `text-primary`.

---

## File layout (showcase demos)

Demos are inline in `ComponentsPage.tsx` (no separate `demos/components/` files). Key section IDs: `forms`, `feedback`, `callout`, `loadings`, `toast`, `three-dot-menu`, `item-lists`, `avatars`, `app-header`, `app-shell`, `theming`, `layout`, `cards`.

---

## Acceptance criteria

1. All **thirteen** sections present on Components tab (see [01-overview.md](./01-overview.md) inventory).
2. Forms demo uses at least three control types from 1.3.0 when implemented.
3. DropdownMenu demo is standalone (not only inside AppHeader).
4. Theming section documents token mapping; toolbar handles live toggling.
