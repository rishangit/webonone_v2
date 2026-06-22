# 06 — UI Kit Extensions

Changes to `@webonone/ui-kit` required for 1.2.0 app shell and theme-aware styling.

Spec baseline: [../1.0.0/05-ui-kit-project.md](../1.0.0/05-ui-kit-project.md).

---

## Dialog (shared modal)

A **common dialog** built on `@radix-ui/react-dialog`, exported from `@webonone/ui-kit` for use in WebOnOne, Identity, Media, and the showcase. All services use the same primitives — no per-service modal copies.

### Exports

| Export | Description |
|--------|-------------|
| `Dialog` | Root (`open` / `onOpenChange`) |
| `DialogTrigger` | Optional trigger |
| `DialogContent` | Centered panel with overlay, close button, **size** prop, fixed header/footer layout |
| `DialogHeader` | **Fixed** top section: title + description; close button in header corner |
| `DialogBody` | **Scrollable** main content (`overflow-y-auto` only on body) |
| `DialogTitle` | Accessible title |
| `DialogDescription` | Muted helper text |
| `DialogFooter` | **Fixed** bottom action row (right-aligned on `sm+`) |
| `DialogClose` | Programmatic close |

### Layout (header / body / footer)

`DialogContent` is a **flex column** with `overflow-hidden` and a max height from the size preset. Consumers structure every dialog as:

```text
DialogContent
  DialogHeader     ← fixed (shrink-0): DialogTitle, DialogDescription, close (X)
  DialogBody       ← scrollable (flex-1 min-h-0 overflow-y-auto): forms, preview, etc.
  DialogFooter     ← fixed (shrink-0): Cancel / Save / Delete buttons
```

| Region | Scroll | Contents |
|--------|--------|----------|
| **Header** | No | Title, description, close button (top-right) |
| **Body** | Yes, when content overflows | All variable content |
| **Footer** | No | Primary / secondary actions |

Only `DialogBody` scrolls — header and footer stay visible while the user scrolls long forms (e.g. create theme + preview).

### Size variants

`DialogContent` accepts `size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'` (default `'md'`). Width and max-height use Tailwind **size scale** classes so consumers pick a preset instead of ad-hoc `className` widths.

| Size | Max width | Max height | Typical use |
|------|-----------|------------|-------------|
| `sm` | `max-w-sm` | `max-h-sm` | Confirm delete, CSS paste import |
| `md` | `max-w-md` | `max-h-md` | Simple forms, alerts |
| `lg` | `max-w-lg` | `max-h-lg` | Medium forms |
| `xl` | `max-w-xl` | `max-h-xl` | Wide forms |
| `2xl` | `max-w-2xl` | `max-h-[min(42rem,90vh)]` | **Create theme** (fields + live preview) |

Implementation notes:

- `DialogContent` uses `flex flex-col overflow-hidden`; **do not** put `overflow-y-auto` on the root panel.
- `DialogBody` is the only scroll container.
- Overlay, focus trap, escape-to-close, and `aria-*` wiring stay in UI Kit (Radix defaults).
- `className` on `DialogContent` **extends** size classes (does not replace them).
- **Nested dialogs** (e.g. import palette inside create theme): render the inner `Dialog` **inside** the outer `DialogContent`; guard outer `onOpenChange` so closing the inner dialog does not dismiss the parent.

```typescript
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}
```

### File layout

```text
ui-kit/package/src/
  components/
    Dialog.tsx           # extend existing Radix wrapper with size + DialogFooter
```

### Showcase

New subsection under **Components → Dialog**:

- Size toggle demo: `sm` / `md` / `lg` / `xl` with sample title, body, footer actions.
- Nested dialog example (outer `lg`, inner `sm`).

---

## New layout exports

| Export | Description |
|--------|-------------|
| `AppShell` | Header + sidebar + main content slot |
| `AppSidebar` | Low-level sidebar (used by AppShell; optional direct use) |
| `NavItem` | Icon + label navigation link |
| `NavGroup` | Expandable/collapsible nav section |
| `SidebarCollapseButton` | Toggle expanded/collapsed |

`AppHeader` props extended:

| Prop | Type | Purpose |
|------|------|---------|
| `onMenuClick` | `() => void` | Mobile hamburger handler |
| `showMenuButton` | `boolean` | Show hamburger (typically `true` below `md`) |
| `menuOpen` | `boolean` | Swap Menu/X icon |

`PageShell` — unchanged API; documented as **legacy/simple** layout for auth pages.

---

## File layout

```text
ui-kit/package/src/
  layouts/
    AppShell.tsx
    AppSidebar.tsx
    PageShell.tsx          # existing
    AuthLayout.tsx         # existing
  components/
    Dialog.tsx             # Radix wrapper + size prop + DialogFooter
    nav/
      NavItem.tsx
      NavGroup.tsx
      SidebarCollapseButton.tsx
    AppHeader.tsx          # extended
  styles/
    globals.css            # neutrals, scrollbar, dark mode
```

Export all from `index.ts`.

---

## `globals.css` updates

### Light neutrals (`:root`)

Keep existing shadcn-style HSL tokens; document explicit hex intent:

| Variable | Light intent |
|----------|--------------|
| `--background` | white `#FFFFFF` |
| `--foreground` | light black `#1A1A1A` |
| `--muted` | gray `#F4F4F5` |
| `--border` | gray `#E4E4E7` |

### Dark neutrals (`.dark`)

| Variable | Dark intent |
|----------|-------------|
| `--background` | `#09090B` |
| `--foreground` | `#FAFAFA` |
| `--card` | `#18181B` |
| `--border` | `#27272A` |

### Scrollbar utilities

```css
/* Conceptual — in @layer utilities */
.scrollbar-themed {
  scrollbar-color: hsl(var(--scrollbar-thumb)) hsl(var(--muted));
}
.scrollbar-themed::-webkit-scrollbar-thumb {
  background: hsl(var(--scrollbar-thumb));
}
```

`--scrollbar-thumb` is set by `@webonone/theme` `applyThemeVariables()` to `color3` at 60% opacity. Apply `scrollbar-themed` to `main` content areas in `AppShell`, **`DialogBody`**, and document in showcase.

### Accent slots (defaults)

Before `ThemeProvider` runs, `:root` includes fallback `--color-1`…`--color-5` matching Platform Default palette. `@webonone/theme` overwrites at runtime.

---

## Component token usage

Components must use semantic Tailwind tokens only:

| Component | Theme-sensitive classes |
|-----------|-------------------------|
| `Button` | `default`: gradient `from-primary-gradient-from to-primary-gradient-to`; `link`: `text-primary`; `ring-ring` on focus |
| `Input` | `border-input`, `focus-visible:ring-ring` |
| `Card` | `bg-card`, `border-border` |
| `DropdownMenu` | `bg-card`, `border-border` |
| Headings in shell | `text-foreground`; demo `text-primary` accent variant in showcase |

**No changes** to component APIs unless adding optional `variant` — prefer token-driven styling.

### Button variant mapping (1.2.0)

| Variant | Token / style |
|---------|----------------|
| `default` | **Gradient** `bg-gradient-to-r from-primary-gradient-from to-primary-gradient-to text-primary-foreground hover:opacity-90` |
| `secondary` | `secondary` (solid) |
| `destructive` | `destructive` / `color4` (solid) |
| `outline` | `border` + `foreground` |
| `ghost` | hover `accent` |
| `link` | `text-primary` (solid `color1`) |

Update `button-variants.ts` `default` variant from flat `bg-primary` to gradient classes above. Extend `tailwind.config.ts` with `primary-gradient-from` / `primary-gradient-to` color keys mapped to CSS variables.

Showcase **Theming** section: side-by-side solid swatches for `color1` + `color2` and live gradient primary button.

---

## `AppShell` props

```typescript
interface AppShellProps {
  children: ReactNode
  nav: NavConfigItem[]
  logo?: ReactNode
  logoHref?: string
  user?: AppHeaderUser | null
  onProfileClick?: () => void
  onLogout?: () => void
  defaultCollapsed?: boolean
  className?: string
}

type NavConfigItem =
  | { type: 'item'; to: string; label: string; icon: LucideIcon }
  | { type: 'group'; label: string; icon: LucideIcon; children: NavItemConfig[] }
```

WebOnOne passes `nav` from feature config; UI Kit does not import routes.

---

## Showcase additions

New showcase section **App Shell**:

- Expanded / collapsed sidebar
- Settings group with nested item
- Mobile viewport toggle (narrow container)
- Theme preview strip (uses local `ThemeProvider` + sample buttons)

New section **Theming**:

- Light/dark toggle
- Platform Default palette preview
- Scrollbar demo in scrollable panel

New section **Dialog** (see above): all four sizes + nested dialog sample.

---

## Consumer migration (WebOnOne)

| Before | After |
|--------|-------|
| `PageShell` on `HomePage` | `AppLayout` → `AppShell` + `<Outlet />` |
| `main` max-w-5xl centered | `AppShell` main: flexible width, padding `p-6` |

Identity and Media: no `AppShell`; only embed theme listener + existing embed layouts.

---

## Build and verification

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
```

Showcase manually verifies responsive nav and theme tokens.

---

## Acceptance criteria

1. All new layouts exported from `@webonone/ui-kit`.
2. `Dialog` + `DialogFooter` + **`DialogBody`** exported; fixed header/footer with body-only scroll.
3. `DialogContent` supports `size` `sm` | `md` | `lg` | `xl` | `2xl` with documented Tailwind max-width / max-height presets.
4. Showcase demonstrates all dialog sizes, scrollable body, and nested dialog (inner close does not dismiss outer).
5. `AppHeader` hamburger props work without breaking Identity usage (props optional).
6. Scrollbar styling visible in showcase themed panel.
7. Button/Input variants reflect CSS variable changes when showcase toggles test theme; primary button gradient updates when `color1` or `color2` changes.
8. No hardcoded accent hex in layout components.
