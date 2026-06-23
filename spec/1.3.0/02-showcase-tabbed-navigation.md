# 02 — Showcase Tabbed Navigation

Restructure `ui-kit/showcase` from a single scrolling page into a **tabbed catalog** aligned with how product teams browse design systems.

Baseline: [../1.0.0/05-ui-kit-project.md](../1.0.0/05-ui-kit-project.md), current `ShowcaseHome.tsx`.

---

## Top-level tabs

| Tab ID | Label | Contents |
|--------|-------|----------|
| `controls` | Controls | Atomic form primitives (see [03-form-controls.md](./03-form-controls.md)) |
| `components` | Components | Composites, layout, feedback, shell (see [04-composite-components.md](./04-composite-components.md)) |
| `dialogs` | Dialogs | All dialog patterns (see [05-dialogs.md](./05-dialogs.md)) |
| `icons` | Icons | Lucide catalog — in-use platform icons (see [08-icons.md](./08-icons.md)) |

Use **URL hash or query** so links are shareable:

```text
http://localhost:3002/#controls
http://localhost:3002/#components
http://localhost:3002/#dialogs
http://localhost:3002/#icons
```

Optional secondary hash for in-tab section: `#controls/password-with-icon`.

Current implementation keeps concise section IDs. Canonical examples:

- Controls: `multi-select`, `multi-select-with-icon`, `phone-input-with-country`, `color-picker`
- Components: `three-dot-menu`, `callout`, `item-lists`, `theming`
- Dialogs: `dialog-theme`, `custom-dialog-nested`

---

## Layout shell

```text
ShowcaseApp
  ShowcaseHeader          ← title + short description
  ThemeToolbar            ← sticky; light/dark + palette + sample primary button
  Tabs (Controls | Components | Dialogs | Icons)
  TabPanel
    ControlsPage          ← vertical stack of DemoSection blocks
    ComponentsPage
    DialogsPage
    IconsPage
```

### ThemeToolbar (global)

Extract from current `ThemingDemo` in `ShowcaseHome.tsx`:

- Light / dark toggle (`.dark` on `document.documentElement`)
- Swatches for `--color-1` … `--color-5` (editable preset buttons or fixed Platform Default + one alternate palette)
- Live **Primary gradient** button + **Link** button
- Applies to **all tabs** without remounting tab content

Integrate `@webonone/theme` `applyThemeVariables()` + `applyColorMode()` (implemented in `ThemeToolbar.tsx` with Platform Default + Forest alternate palette).

### DemoSection pattern

Each subsection uses a consistent wrapper:

```tsx
interface DemoSectionProps {
  id: string           // anchor id, e.g. "password-with-icon"
  title: string
  description?: string
  children: React.ReactNode
}
```

Visual treatment:

- Section title: `text-lg font-semibold text-foreground`
- Optional description: `text-sm text-muted-foreground`
- Demo surface: `rounded-lg border bg-card p-6`
- Show **default**, **disabled**, and **error** states where applicable

---

## File layout (showcase)

Implemented layout (demos live inline in tab pages — no separate `demos/` folder):

```text
ui-kit/showcase/src/
  pages/
    ShowcaseApp.tsx          # hash routing + Radix Tabs
    ShowcaseHome.tsx           # re-export of ShowcaseApp (default route)
    ControlsPage.tsx
    ComponentsPage.tsx
    DialogsPage.tsx
    IconsPage.tsx
  data/
    platform-icons.ts          # PLATFORM_ICONS registry
  components/
    DemoSection.tsx
    ThemeToolbar.tsx
    showcase-nav.ts            # tab definitions
```

`ShowcaseHome.tsx` remains as a thin re-export for backward compatibility.

---

## In-tab navigation (optional phase 2)

Right-rail or sticky left **section index** on Controls tab (longest list):

```text
Buttons
Buttons with icons
Input text
...
```

Click scrolls to `#section-id`. Not required for 1.3.0 MVP if top-level tabs ship first.

---

## Accessibility

- Tab list: Radix `@radix-ui/react-tabs` or roving-focus button group with `role="tablist"`.
- `aria-selected`, keyboard ←/→ between tabs.
- Theme toolbar controls labeled (`aria-label` on icon-only toggles).

---

## Acceptance criteria

1. Four tabs render; switching preserves ThemeToolbar state.
2. Every section listed in [01-overview.md](./01-overview.md) has a `DemoSection` with a stable anchor ID documented in the tab page implementation.
3. Deep link `#controls` opens Controls tab on load.
4. No regression: all demos previously in `ShowcaseHome` appear under the correct tab.
5. Showcase uses `@/` path aliases per `code-cleanliness.mdc`.

---

## Verification

```bash
npm run dev -w ui-kit-root
npm run type-check -w ui-kit-root
```

Manual: resize to mobile; confirm tab list wraps or scrolls; confirm theme toggle affects active tab demos.
