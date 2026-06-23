# 08 — Icons catalog

Platform icons use **[Lucide React](https://lucide.dev/)** (`lucide-react`). The showcase **Icons** tab is the canonical inventory of glyphs already used in `@webonone/ui-kit` and demo pages.

---

## Showcase tab

| Tab ID | Label | Contents |
|--------|-------|----------|
| `icons` | Icons | Grouped grid of every in-use Lucide icon + usage notes |

Deep link: `http://localhost:3002/#icons`

---

## Source of truth

| File | Role |
|------|------|
| [`ui-kit/showcase/src/data/platform-icons.ts`](../../../ui-kit/showcase/src/data/platform-icons.ts) | `PLATFORM_ICONS` registry — name, category, `usedIn` |
| [`ui-kit/showcase/src/pages/IconsPage.tsx`](../../../ui-kit/showcase/src/pages/IconsPage.tsx) | Renders catalog by category |

When adding an icon to a package component or showcase demo:

1. Import from `lucide-react` (never duplicate SVGs in product code).
2. Add or update the entry in `platform-icons.ts`.
3. Confirm the Icons tab shows the new glyph.

---

## Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `action` | Primary actions, save/delete/logout | `Plus`, `Save`, `Trash2`, `LogOut`, `RefreshCw` |
| `navigation` | Shell nav, carets, collapse | `Home`, `ArrowRight`, `ChevronLeft`, `PanelLeftOpen` |
| `form` | Input leading icons, field affordances | `Search`, `Mail`, `Lock`, `Phone`, `User`, `Tags` |
| `selection` | Checks, carets, picker indicators | `Check`, `ChevronDown`, `ChevronsUpDown`, `Circle` |
| `media` | Content / asset nav | `Image`, `Palette`, `Tag` |
| `chrome` | Header, overflow, dismiss | `Menu`, `MoreVertical`, `Settings`, `X` |

---

## Current inventory (32 icons)

### Action (5)

| Icon | Used in |
|------|---------|
| `LogOut` | `AppHeader` |
| `Plus` | Showcase — Buttons with icons |
| `RefreshCw` | Showcase — Buttons with icons |
| `Save` | Showcase — CustomDialog form |
| `Trash2` | Showcase — Delete dialog |

### Navigation (6)

| Icon | Used in |
|------|---------|
| `ArrowRight` | Showcase — Buttons with icons |
| `ChevronLeft` | `Calendar` |
| `ChevronRight` | `Calendar`, `DropdownMenuSubTrigger` |
| `Home` | Showcase — AppShell nav |
| `PanelLeftClose` | `SidebarCollapseButton` |
| `PanelLeftOpen` | `SidebarCollapseButton` |

### Form & input (9)

| Icon | Used in |
|------|---------|
| `Calendar` | `DatePicker` |
| `Eye` | `PasswordInput` |
| `EyeOff` | `PasswordInput` |
| `Lock` | `PasswordInput` |
| `Mail` | Showcase — Email input with icon |
| `Phone` | `PhoneInput` |
| `Search` | Showcase — Input with icon |
| `Tags` | Showcase — MultiSelect with icon |
| `User` | `AppHeader`, Showcase — Select with icon |

### Selection (5)

| Icon | Used in |
|------|---------|
| `Check` | `Checkbox`, `Select`, `MultiSelect`, `DropdownMenu`, `PhoneCountrySelect` |
| `ChevronDown` | `Select`, `PhoneCountrySelect`, `NavGroup` |
| `ChevronUp` | `Select` |
| `ChevronsUpDown` | `MultiSelect` |
| `Circle` | `DropdownMenuRadioItem` |

### Media (3)

| Icon | Used in |
|------|---------|
| `Image` | Showcase — AppShell nav |
| `Palette` | Showcase — AppShell nav |
| `Tag` | Showcase — CustomDialog form |

### App chrome (4)

| Icon | Used in |
|------|---------|
| `Menu` | `AppHeader` |
| `MoreVertical` | `ItemListMenu`, Showcase — 3-dot menu |
| `Settings` | Showcase — AppShell nav |
| `X` | `Dialog`, `CustomDialog`, `MultiSelect`, `AppHeader` |

> **Note:** `ClipboardPaste` appears in the Callout demo button but is showcase-only and not yet in `PLATFORM_ICONS`.

---

## Usage conventions

| Rule | Detail |
|------|--------|
| Library | `lucide-react` only |
| Default size | `h-4 w-4` (`size-4`) in buttons, inputs, menu rows |
| Color | `text-muted-foreground` for leading field icons; `text-foreground` or `currentColor` for actions |
| Accessibility | Decorative icons: `aria-hidden`; icon-only buttons: `aria-label` on the control |
| API pattern | `leadingIcon?: LucideIcon` on controls that support it (`SelectTrigger`, `MultiSelect`); `InputGroup` uses `InputGroupIcon` composition |
| New icons | Add to `platform-icons.ts` before merge |

---

## Acceptance criteria

1. Icons tab lists all entries in `PLATFORM_ICONS` grouped by category.
2. Each card shows glyph, Lucide name, and `usedIn` summary.
3. Count in overview matches registry length (32 at 1.3.0).
4. `#icons` deep link opens Icons tab.
5. Theme toolbar changes accent; icon tiles remain readable (`text-foreground` / `bg-muted`).

---

## Verification

```bash
npm run dev -w ui-kit-root
npm run type-check -w ui-kit-root
```

Manual: open `#icons`; confirm six category sections and 32 total icons.
