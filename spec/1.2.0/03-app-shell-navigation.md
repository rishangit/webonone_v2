# 03 — App Shell and Navigation

Defines the authenticated layout for WebOnOne v2: header, left sidebar, mobile drawer, and Settings → System Theme submenu.

Related: [06-ui-kit-extensions.md](./06-ui-kit-extensions.md), [07-webonone-v2-implementation.md](./07-webonone-v2-implementation.md).

---

## Layout overview

```text
┌──────────────────────────────────────────────────────────────────┐
│  Header: [☰ mobile] [Logo]                    [User avatar ▼]   │
├──────────────┬───────────────────────────────────────────────────┤
│  Left nav    │  Main content (Outlet)                            │
│  [icon] Home │                                                   │
│  [icon] Demo │                                                   │
│  [icon] Set▾ │                                                   │
│    └ Theme   │                                                   │
│  [◀ collapse]│                                                   │
└──────────────┴───────────────────────────────────────────────────┘
```

- **Header** — always visible on authenticated routes.
- **Left nav** — persistent on `md+`; off-canvas drawer on `< md`.
- **Main** — React Router `<Outlet />` for feature pages.

---

## Components (UI Kit)

| Component | Responsibility |
|-----------|----------------|
| `AppShell` | Composes header, sidebar, main; manages mobile open state |
| `AppSidebar` | Renders nav tree; collapsed vs expanded width |
| `NavItem` | Single link: `icon`, `label`, `href` or `to`, active state |
| `NavGroup` | Expandable parent (e.g. Settings) with child `NavItem`s |
| `AppHeader` | Extended with optional `onMenuClick`, `showMenuButton` |

`PageShell` remains exported for **unauthenticated** routes (`/login`, `/callback`) and simple pages. Authenticated product routes migrate to `AppShell`.

---

## Navigation items

Every nav entry displays **icon + text** when the sidebar is expanded.

| Requirement | Detail |
|-------------|--------|
| Icon library | `lucide-react` (consistent with existing `AppHeader`) |
| Icon size | `20px` (`h-5 w-5`) aligned with label |
| Label | Visible when expanded; `sr-only` or hidden when collapsed |
| Active state | Accent left border or background using `--primary` |
| Tooltip | When collapsed, show label on hover/focus via accessible tooltip |

### 1.2.0 nav structure (WebOnOne)

| Item | Icon (suggested) | Route | Notes |
|------|------------------|-------|-------|
| Home | `Home` | `/` | Default landing |
| Media demo | `Image` | `/demo/media` | Existing demo |
| Settings | `Settings` | — | `NavGroup`, not a leaf link |
| └ System Theme | `Palette` | `/settings/system-theme` | Submenu child |

Future nav items are added in WebOnOne `features/shell/config/navItems.ts` — not hardcoded in UI Kit.

---

## Header hamburger (mobile)

| Viewport | Behavior |
|----------|----------|
| `< md` (`< 768px`) | Show hamburger button in header **left** (before logo). Tapping opens sidebar drawer. |
| `≥ md` | Hide hamburger; sidebar always visible (expanded or collapsed). |

Requirements:

- Hamburger uses `Menu` / `X` icon toggle when drawer open.
- Button `aria-label`: "Open navigation" / "Close navigation".
- Drawer overlays content with backdrop; tap backdrop or navigate closes drawer.
- **Hamburger stays in header on mobile** even when drawer is open (toggles to close).

---

## Desktop sidebar collapse

| State | Width | Nav labels | Toggle control |
|-------|-------|------------|----------------|
| **Expanded** | `16rem` (`w-64`) | Visible | Chevron/panel icon at sidebar bottom or top |
| **Collapsed** | `4rem` (`w-16`) | Hidden; icons centered | Same control expands |

Requirements:

- Smooth width transition (`transition-[width] duration-200`).
- Collapse preference stored in `localStorage` key `webonone:sidebar-collapsed` (UI-only; not synced to server in 1.2.0).
- Collapsed mode: `NavGroup` children accessible via flyout popover on Settings icon click (not inline indent).
- Main content area reflows; no horizontal page scroll from sidebar animation.

---

## Settings submenu

Settings is a **nav group**, not a direct route in 1.2.0.

| Behavior | Expanded sidebar | Collapsed sidebar |
|----------|------------------|-------------------|
| Parent click | Toggle children visibility | Open flyout with children |
| Child click | Navigate to route; mobile closes drawer | Navigate; flyout closes |
| Active child | Parent group shown as active | Parent icon highlighted |

System Theme route: `/settings/system-theme` — see [04-system-theme.md](./04-system-theme.md).

Optional future siblings (out of scope): `/settings/profile`, `/settings/notifications`.

---

## Routing integration (WebOnOne)

```tsx
// Conceptual
<Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
  <Route index element={<HomePage />} />
  <Route path="demo/media" element={<MediaDemoPage />} />
  <Route path="settings/system-theme" element={<SystemThemePage />} />
</Route>
<Route path="/login" element={<LoginPage />} />
<Route path="/callback" element={<AuthCallbackPage />} />
```

`AppLayout` wraps `AppShell` + `<Outlet />` + `ThemeProvider`.

---

## Accessibility

- Skip link: "Skip to main content" as first focusable element.
- Mobile drawer: focus trap while open; restore focus to hamburger on close.
- Keyboard: `Escape` closes mobile drawer.
- `nav` landmark with `aria-label="Main navigation"`.
- Collapsed icons: `aria-label` on each `NavItem` when label not visible.

---

## Responsive breakpoints

Follow Tailwind defaults (mobile-first):

| Breakpoint | Layout |
|------------|--------|
| default | Drawer nav, hamburger visible |
| `md` | Fixed sidebar, hamburger hidden |
| `lg` | Same; optional wider main max-width |

---

## Acceptance criteria

1. Home and Media demo render inside `AppShell` with icon + label nav.
2. Mobile: hamburger opens/closes drawer; navigation closes drawer on link select.
3. Desktop: collapse toggles icon-only mode with tooltips.
4. Settings expands to show System Theme; route loads theme management UI.
5. `/login` and `/callback` do **not** use `AppShell` (no sidebar).
6. UI Kit showcase includes AppShell demo with collapsed/expanded and mobile viewport.
