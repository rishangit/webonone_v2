# 05 — Theme tab appearance

**Basic Settings → Theme** is the everyday place to switch **light** and **dark** appearance. Accent color palettes remain on **System Theme**.

## Layout

One **Appearance** card (section):

| Element | Content |
|---------|---------|
| Card / section title | **Appearance** |
| Optional description | “Choose light or dark mode for the platform.” |
| Body | Two **selectable cards** side by side (stack on narrow viewports) |

## Selectable cards

| Card | Icon | Title | Selected when |
|------|------|-------|---------------|
| Light | Lucide **Sun** (or equivalent light icon) | **Light** | `colorMode === 'light'` |
| Dark | Lucide **Moon** (or equivalent dark icon) | **Dark** | `colorMode === 'dark'` |

### Card UI

- Selectable surface matching Choose account / role cards: border, selected = `border-primary` + `bg-primary/10` (or existing selection pattern).
- Icon above or beside title; short optional subtitle (“Bright surfaces” / “Dimmed surfaces”) — keep copy minimal.
- Exactly one selected at a time.
- Clicking a card immediately applies that mode (no separate Save), unless product prefers Apply — **default: immediate apply**.

### Behavior

1. Read current mode from system theme preferences (`preferences.colorMode`, default `light`).
2. On select → `PATCH /me/preferences` `{ colorMode }` via existing `systemTheme` store/epics.
3. Theme provider bridge applies tokens / `dark` class as today.
4. Selection survives refresh (server preferences + existing ThemeProviderBridge).

## System Theme page

| Keep | Change |
|------|--------|
| Theme palette list, create/edit/delete | Unchanged |
| Color mode **button toggle** on System Theme | **Remove** duplicate toggle **or** replace with a one-line link: “Change appearance in Basic Settings” |

Prefer removing the duplicate `ColorModeToggle` from System Theme so Basic Settings Theme is the single appearance home.

## Out of scope on this tab

- Creating / editing accent themes
- Import CSS theme variables
- Per-company appearance overrides

## Acceptance

1. Theme tab shows Appearance with Light and Dark selectable cards + icons.
2. Selecting Dark switches the shell to dark; selecting Light restores light.
3. Refresh keeps the chosen mode.
4. System Theme no longer duplicates a second primary appearance control (or clearly defers to Basic Settings).
5. Type-check green.
