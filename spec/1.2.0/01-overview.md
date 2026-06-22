# 01 — Overview (1.2.0)

## Vision

WebOnOne v2 becomes a **product shell** with professional app chrome: responsive left navigation, a Settings area, and a **System Theme** feature that lets users create accent palettes and switch between **light** and **dark** mode. Themes persist in `webonone_v2` and apply across the core app, **embedded microservice UIs** (iframe + `postMessage`), and **full-page URL redirects** to Identity/Media (`@webonone/platform-nav` + theme query params).

## Goals (1.2.0)

1. **Responsive app shell** — left navigation with icon + label items; hamburger in header on mobile; collapsible sidebar on desktop (full labels vs icon-only).
2. **Settings navigation** — Settings is a top-level nav group with **System Theme** as a submenu route.
3. **User-created themes** — authenticated users create named themes from five accent colors; themes are stored in the database.
4. **Light and dark mode** — global appearance mode independent of accent palette; backgrounds use fixed neutral tokens, not accent colors.
5. **Runtime styling** — selected theme updates buttons (primary **gradient** from `color1` → `color2`), inputs, scrollbars, borders, and titles via semantic CSS variables.
6. **Cross-service consistency** — embedded iframes receive theme via `postMessage`; full-page redirects to Identity/Media carry the same palette via URL query params (no cross-service theme API on the redirect path).

## Scope (1.2.0)

### In scope

- UI Kit: `AppShell`, `AppSidebar`, `NavItem`, `NavGroup`, mobile drawer, desktop collapse control; **`Dialog`** with `sm` / `md` / `lg` / `xl` sizes.
- WebOnOne v2: authenticated layout wrapper, nav config, Settings → System Theme pages; **theme create/edit/delete via dialogs** with CColorPalette CSS import.
- Backend: `system_themes` CRUD, `user_preferences` (active theme + color mode), REST under `/api/v1`.
- Package `@webonone/theme`: theme DTO, CSS variable builder, `ThemeProvider`, embed `postMessage`, **URL query serialize/parse**, redirect bootstrap hook.
- `@webonone/platform-nav`: optional `extraSearchParams` on `buildLoginRedirectUrl`; theme passed via existing `redirectWithAuthCode` `extraSearchParams`.
- UI Kit token layer: map accent palette → `--primary`, `--ring`, `--border`, etc.; scrollbar utilities; light/dark neutral backgrounds.
- Identity + Media: embed theme listener (`postMessage`) **and** redirect theme bootstrap (URL query params + relay on outbound redirects).
- UI Kit showcase: demo AppShell states and theme switcher.

### Out of scope (1.2.0)

- Per-site or per-tenant themes (single user preference in 1.2.0; org-level theming is a future spec).
- Theme sharing between users or public theme marketplace.
- Identity/Media **standalone direct visit** (no core redirect, no theme params) — default UI Kit theme; no local theme editor.
- Identity/Media fetching theme from WebOnOne API on every page load.
- Server-side rendering of themes or email/PDF theming.
- Image assets, fonts, or border-radius per theme (accent colors + light/dark only).
- Automatic contrast checking beyond minimum manual validation in the theme form.

## Glossary

| Term | Definition |
|------|------------|
| **webonone_v2** | MySQL database for the WebOnOne core service (`webonone-v2/`); live data store for themes, user preferences, and all core domain tables |
| **App shell** | Combined header + left nav + main content layout wrapping authenticated WebOnOne routes |
| **Accent palette** | Five user-defined hex colors with **fixed roles**: primary, secondary, accent, background, text |
| **Neutral palette** | *(Removed in 1.2.0 semantic model)* — surfaces and text come from `color4` / `color5`; dark mode swaps them |
| **Color mode** | `light` or `dark` — controls background/surface/foreground neutrals only |
| **System theme** | A named, persisted accent palette record in `webonone_v2` |
| **Active theme** | The theme currently selected by the logged-in user (stored in `user_preferences`) |
| **Collapsed sidebar** | Desktop state showing nav icons only; labels hidden; width reduced |
| **Theme propagation** | Apply accents via CSS variables — iframe `postMessage` (channel A) or URL query params on `@webonone/platform-nav` redirect (channel B) |
| **Theme relay** | When a peer service redirects to another, forward existing `theme_*` query params |

## Reference palette

Default seed palette. Roles: color1 primary … color5 text. Source: [CColorPalette](https://ccolorpalette.com/).

```css
:root {
  --color-1: #2563EB;
  --color-2: #3B82F6;
  --color-3: #F59E0B;
  --color-4: #F8FAFC;
  --color-5: #1E293B;
}
```

Palette generators export harmonious colors only; this platform maps slot order to UI roles (see [04-system-theme.md](./04-system-theme.md)).

## Success criteria

- Authenticated WebOnOne routes render inside `AppShell` with left nav (icon + text) and header hamburger on viewports `< md`.
- Desktop: user can collapse sidebar to icon-only; expand restores labels; preference persists in `localStorage` (UI state only).
- Settings → System Theme: user creates a theme via **dialog** (name + five colors + live preview); **Paste from CColorPalette** imports a `:root` CSS block; list shows saved themes; selecting one applies immediately and persists to DB.
- Light/dark toggle changes backgrounds and neutral text while accent buttons/borders update from the active palette.
- Buttons, `Input`, scrollbars, borders, and heading accents visibly change when switching themes; primary buttons show **color1 → color2** gradient (showcase documents each).
- Media picker embed inside WebOnOne reflects the same theme after parent selection changes.
- Identity login iframe inside WebOnOne `/login` reflects parent theme (embed / channel A).
- WebOnOne → Identity profile (`redirectWithAuthCode`) shows the same theme accents (URL redirect / channel B).
- WebOnOne → Media full-page navigation shows the same theme accents (channel B).
- `npm run dev` from repo root; WebOnOne type-check and UI Kit build pass.
