# 07 — WebOnOne v2 Implementation

Concrete implementation guide for WebOnOne v2 backend and frontend in 1.2.0.

Baseline: [../1.0.0/04-webonone-v2-project.md](../1.0.0/04-webonone-v2-project.md).

---

## Folder layout (additions)

```text
webonone-v2/
  backend/
    migrations/
      YYYYMMDDHHMMSS_create_system_themes.ts
      YYYYMMDDHHMMSS_create_user_preferences.ts
      YYYYMMDDHHMMSS_seed_platform_default_theme.ts
    src/
      routes/
        themes.ts
        preferences.ts
      services/
        themeService.ts
        preferenceService.ts
      schemas/
        themeSchemas.ts
  frontend/
    src/
      app/
        AppLayout.tsx              # AppShell + Outlet + ThemeProvider
        router.tsx                   # nested authenticated routes
      features/
        shell/
          config/navItems.ts
        settings/
          system-theme/
            pages/SystemThemePage.tsx
            components/
              ThemeList.tsx
              ThemeCreateDialog.tsx      # lg Dialog: name, colors, preview, import link
              ThemeCssImportDialog.tsx   # sm nested Dialog: textarea + parse apply
              ThemeDeleteDialog.tsx      # sm confirm
              ThemePreview.tsx
              ColorModeToggle.tsx
            utils/
              parseCssThemeVariables.ts  # --color-1..5 from pasted CSS
            store/
              systemThemeSlice.ts
              systemThemeEpics.ts
            services/themeApi.ts
            schemas/themeFormSchema.ts
      shared/
        theme/
          ThemeProviderBridge.tsx    # wires Redux + @webonone/theme
```

---

## Backend routes

Register under `/api/v1` with existing JWT middleware.

### `themes.ts`

- `GET /` — list themes for user (`created_by = sub` OR `is_system = 1`)
- `POST /` — create; set `created_by` from JWT
- `GET /:id` — get by id if visible
- `PATCH /:id` — update if `created_by = sub` and `is_system = 0`
- `DELETE /:id` — delete with active-theme fallback logic

### `preferences.ts`

- `GET /me/preferences` — join active theme row
- `PATCH /me/preferences` — upsert `user_preferences`

Use `validateBody` + Zod per `form-creation` skill patterns.

---

## Frontend routing

```text
/login                    → LoginPage (PageShell or minimal — no AppShell)
/callback                 → AuthCallbackPage
/                         → AppLayout
  /                       → HomePage
  /demo/media             → MediaDemoPage
  /settings/system-theme  → SystemThemePage
```

`PrivateRoute` wraps `AppLayout` (not each child).

---

## Nav configuration

```typescript
// features/shell/config/navItems.ts — conceptual
export const mainNav = [
  { type: 'item', to: '/', label: 'Home', icon: Home },
  { type: 'item', to: '/demo/media', label: 'Media demo', icon: Image },
  {
    type: 'group',
    label: 'Settings',
    icon: Settings,
    children: [
      { to: '/settings/system-theme', label: 'System Theme', icon: Palette },
    ],
  },
] satisfies NavConfigItem[]
```

---

## Theme integration

### Dependencies

```json
{
  "@webonone/theme": "*"
}
```

Root `package.json`: add `build:theme` and workspace entry.

### `ThemeProviderBridge`

- Reads `preferences` from Redux after login.
- Passes `selectTheme` / `setColorMode` dispatching epics + calling `applyThemeVariables`.
- On change: `broadcastThemeToIframes` (channel A).

### URL redirect handoff (channel B)

Update all `@webonone/platform-nav` redirect call sites to attach theme params:

```typescript
// features/auth/utils/redirectToIdentityProfile.ts — conceptual
import { serializeThemeQueryParams, buildThemePayload } from '@webonone/theme'

extraSearchParams: serializeThemeQueryParams(
  buildThemePayload(activeTheme, colorMode),
),
```

| Call site | Redirect |
|-----------|----------|
| `redirectToIdentityProfile` | WebOnOne → Identity `/profile` |
| Future full-page Media links | WebOnOne → Media `/upload` or `/picker` |
| Login redirect builder | WebOnOne → Identity `/login` (`buildLoginRedirectUrl` + `extraSearchParams`) |

See [08-theme-url-redirect-integration.md](./08-theme-url-redirect-integration.md).

Optional: append theme to `returnUrl` for faster paint when returning to core.

### Media demo

`MediaPickerModal` / iframe `onLoad` → trigger theme broadcast to that iframe (channel A).

### Login page

When showing `IdentityLoginFrame`, on iframe load broadcast current theme (channel A). For full redirect login, pass theme query params (channel B).

---

## Environment

No new required env vars for 1.2.0. Theme API uses existing `VITE_API_BASE_URL`.

| Variable | Where | Example |
|----------|-------|---------|
| `DATABASE_URL` | backend | `mysql://.../webonone_v2` |

---

## Database migrations

1. `system_themes` table per [04-system-theme.md](./04-system-theme.md).
2. `user_preferences` table.
3. Seed `Platform Default` with `is_system = 1`.

Run: `npm run migrate -w webonone-v2-root` (or project-specific migrate command).

---

## Identity and Media follow-ups

Delegated to respective service agents (not WebOnOne scope):

| Service | Change |
|---------|--------|
| `identity/frontend` | `useEmbedThemeListener` in embed auth pages; `useRedirectThemeBootstrap` in app root; relay theme on `completeAuthRedirect` |
| `media/frontend` | `useEmbedThemeListener` in `EmbedLayout`; `useRedirectThemeBootstrap` in app root; relay on outbound redirects |
| `packages/platform-nav` | `buildLoginRedirectUrl` optional `extraSearchParams` |

WebOnOne spec defines contract; implementation tracked in same 1.2.0 release.

---

## Verification

```bash
npm run build:theme
npm run build -w @webonone/ui-kit
npm run type-check -w webonone-v2-root
npm run lint -w webonone-v2-root
```

Manual test plan:

1. Login → see left nav with icons and labels.
2. Resize to mobile → hamburger opens drawer.
3. Desktop → collapse sidebar → icons only with tooltips.
4. Settings → System Theme → **Create theme** opens dialog → preview updates live → save → apply → buttons change color.
5. In create dialog → **Paste from CColorPalette** → paste `:root { --color-1: … }` block → Apply fills five colors.
6. Toggle dark mode → background darkens; accents unchanged hue.
7. Open Media demo embed → picker matches theme.
8. Logout/login → same theme restored from API.

---

## Acceptance criteria

1. Migrations apply cleanly on empty `webonone_v2`.
2. All API routes return proper 401 without JWT.
3. Authenticated shell on `/`, `/demo/media`, `/settings/system-theme`.
4. `/login` without sidebar.
5. Theme CRUD via **UI Kit dialogs**; CSS import from CColorPalette paste works.
6. Open Media demo embed → picker matches theme (channel A).
7. Profile redirect → Identity matches theme (channel B).
8. Theme CRUD and preferences persist across sessions.
