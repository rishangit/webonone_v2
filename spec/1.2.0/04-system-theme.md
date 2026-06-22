# 04 — System Theme

User-created palettes, light/dark color mode, database persistence, and runtime application to UI Kit semantic tokens.

Sites like [CColorPalette](https://ccolorpalette.com/) export **five harmonious colors** without UI roles. This platform assigns **fixed semantic roles** to each slot when applying a theme.

---

## Color model

### Palette slots (semantic roles)

| Slot | Role | Maps to (examples) |
|------|------|---------------------|
| **color1** | Primary brand | Logo accents, primary buttons (gradient start), active nav, links |
| **color2** | Secondary | Secondary buttons, highlights, cards, gradient end |
| **color3** | Accent | Notifications, badges, charts, callouts, focus ring, scrollbar thumb |
| **color4** | Background | Page background, sections, cards, popovers (light mode) |
| **color5** | Text / contrast | Headings, body text, icons, borders (derived, light mode) |

**Example palette** (Platform Default seed):

| Slot | Hex | Role |
|------|-----|------|
| color1 | `#2563EB` | Blue — primary |
| color2 | `#3B82F6` | Light blue — secondary |
| color3 | `#F59E0B` | Orange — accent |
| color4 | `#F8FAFC` | Very light gray — background |
| color5 | `#1E293B` | Dark slate — text |

Paste from CColorPalette fills `--color-1` … `--color-5` in order; the user (or Platform Default seed) is responsible for picking colors that fit each role.

### Destructive actions

**Not** a palette slot. `destructive` buttons use a **platform-fixed** red (`#DC2626`) so error actions stay recognizable regardless of brand palette.

### Color mode (light / dark)

| Mode | Surfaces (`--background`, `--card`, …) | Text (`--foreground`, …) |
|------|------------------------------------------|---------------------------|
| `light` | **color4** | **color5** |
| `dark` | **color5** | **color4** |

Dark mode **swaps** background and text slots so a palette designed with a light surface and dark text inverts sensibly (e.g. `#F8FAFC` / `#1E293B` → dark slate background, light gray text).

### Glass site background

The background slot is **not** painted as a solid fill. `@webonone/theme` sets:

| Token | Purpose |
|-------|---------|
| `--background-base` | Neutral canvas (white / dark zinc) at full opacity |
| `--background-tint` | Theme hue from color4 (light) or color5 (dark) |
| `--background-tint-opacity` | Wash strength (`0.16` light / `0.24` dark) |
| `--background`, `--card` | Frosted panels at ~78% opacity |

`body` uses soft **radial gradients** from `--background-tint` so the page shows a subtle brand wash. Header, sidebar, cards, and dialogs use UI Kit `.surface-glass` (`backdrop-blur` + semi-transparent `--background`).

`applyColorMode()` still toggles `class="dark"` on `<html>`; tokens are set inline by `@webonone/theme`.

### Raw + semantic CSS variables

| Field | CSS variable | Semantic tokens set by `applyThemeVariables` |
|-------|--------------|-----------------------------------------------|
| `color1` | `--color-1` | `--primary`, `--primary-gradient-from` |
| `color2` | `--color-2` | `--secondary`, `--primary-gradient-to` |
| `color3` | `--color-3` | `--accent`, `--ring`, `--scrollbar-thumb` (60% opacity) |
| `color4` | `--color-4` | `--background-tint`, glass surfaces (light mode source) |
| `color5` | `--color-5` | `--foreground`, `--card-foreground`, `--border`, `--input` (light mode text/borders) |

Borders use `color5` at 15% opacity; muted text uses `color5` at 70% opacity.

See [05-theme-propagation.md](./05-theme-propagation.md) for the full token table.

### Primary button gradient

The **`default` Button** uses a **left-to-right linear gradient** from **color1** (primary) to **color2** (secondary):

| Gradient stop | Source | CSS variable |
|---------------|--------|--------------|
| Start | color1 | `--primary-gradient-from` |
| End | color2 | `--primary-gradient-to` |

- **`--primary-foreground`:** contrast text vs darker of `color1` / `color2`.
- **`secondary`**, **`outline`**, **`ghost`**, **`destructive`** variants use solid tokens (no gradient on destructive).

Preview panel must show the gradient primary button updating live when `color1` or `color2` changes.

Color mode is stored per user in `user_preferences.color_mode` and can be toggled from System Theme page.

---

## Database schema (`webonone_v2`)

### `system_themes`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `CHAR(21)` PK | nanoid, generated in Node |
| `name` | `VARCHAR(100)` NOT NULL | Display name |
| `color1` | `CHAR(7)` NOT NULL | `#RRGGBB` |
| `color2` | `CHAR(7)` NOT NULL | |
| `color3` | `CHAR(7)` NOT NULL | |
| `color4` | `CHAR(7)` NOT NULL | |
| `color5` | `CHAR(7)` NOT NULL | |
| `created_by` | `CHAR(21)` NOT NULL | JWT `sub` (user id copy) |
| `is_system` | `TINYINT(1)` DEFAULT 0 | `1` = seeded default, non-deletable |
| `created_at` | `DATETIME` | |
| `updated_at` | `DATETIME` | |

Indexes: `created_by`, `name` (non-unique).

**Seed migration:** insert one `is_system = 1` theme named "Platform Default" with the CColorPalette values.

### `user_preferences`

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `CHAR(21)` PK | JWT `sub` |
| `active_theme_id` | `CHAR(21)` NOT NULL | FK logical to `system_themes.id` |
| `color_mode` | `ENUM('light','dark')` NOT NULL DEFAULT `'light'` |
| `updated_at` | `DATETIME` | |

One row per user; upsert on first login or first preference save.

---

## REST API (`/api/v1`)

All routes require `Authorization: Bearer <JWT>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/themes` | List themes visible to user (own + `is_system`) |
| `POST` | `/themes` | Create theme |
| `GET` | `/themes/:id` | Get one theme |
| `PATCH` | `/themes/:id` | Update theme (creator only; not `is_system`) |
| `DELETE` | `/themes/:id` | Delete theme (creator only; not `is_system`; reassign active if needed) |
| `GET` | `/me/preferences` | `{ activeThemeId, colorMode, theme }` |
| `PATCH` | `/me/preferences` | `{ activeThemeId?, colorMode? }` |

### Create theme body

```json
{
  "name": "My Brand",
  "color1": "#2563EB",
  "color2": "#3B82F6",
  "color3": "#F59E0B",
  "color4": "#F8FAFC",
  "color5": "#1E293B"
}
```

Zod validation: name 1–100 chars; colors match `/^#[0-9A-Fa-f]{6}$/`.

### Preference patch side effects

- If `activeThemeId` references missing theme → `400`.
- If deleted theme was active → API sets active to system default theme.

---

## System Theme UI (`/settings/system-theme`)

### Page sections

| Section | Content |
|---------|---------|
| **Color mode** | Segmented control or toggle: Light / Dark |
| **Theme list** | Cards or table: name, color swatches, Select / Edit / Delete |
| **Create theme** | **Button** opens create-theme dialog (not inline form on page) |
| **Preview** | Live preview inside create/edit dialog **below** the form fields |

Create and edit use `@webonone/ui-kit` **`Dialog`** (`size="2xl"`). Delete confirmation uses **`Dialog`** (`size="sm"`).

---

### Create / edit theme dialog

Opened from **Create theme** on the page, or **Edit** on a non-system theme row.

| Area | Content |
|------|---------|
| **Title** | "Create theme" or "Edit theme" |
| **Hint** | Short note: build a palette on [CColorPalette](https://ccolorpalette.com/), then copy the CSS variables into this form (see import link below). |
| **Theme name** | Required text input (1–100 chars) |
| **Five colors** | `color1`–`color5`: native `type="color"` + hex text field per row; fields stay in sync |
| **Import link** | Text link: **"Paste from CColorPalette"** — opens nested import dialog (`size="sm"`) |
| **Preview** | `ThemePreview` panel **below** the color fields inside the same dialog — sample Button (gradient primary), Input, title, card, scrollbar strip; updates live as colors change |
| **Footer** | Cancel (closes dialog) + Save (calls `POST /themes` or `PATCH /themes/:id`) |

Pre-fill new theme with Platform Default colors; user may edit before save.

On success: close dialog, refresh list, optionally auto-select new theme.

### Paste from CColorPalette (nested dialog)

Triggered by **"Paste from CColorPalette"** inside the create/edit dialog.

| Area | Content |
|------|---------|
| **Title** | "Import palette" |
| **Description** | Paste the `:root { … }` block from [CColorPalette](https://ccolorpalette.com/) (Export → CSS variables). |
| **Textarea** | Monospace, min height ~8 rows; placeholder shows expected format (see below) |
| **Footer** | Cancel + **Apply** |

**Expected paste format** (whitespace and semicolons optional; case-insensitive variable names):

```css
:root {
  --color-1: #2563EB;
  --color-2: #3B82F6;
  --color-3: #F59E0B;
  --color-4: #F8FAFC;
  --color-5: #1E293B;
}
```

**Apply behavior:**

1. Parse textarea for `--color-1` … `--color-5` (accept `#RGB` or `#RRGGBB`; normalize to uppercase `#RRGGBB`).
2. If all five are valid hex, write them into the parent dialog’s `color1`–`color5` fields and **close only the import dialog**.
3. The **create/edit dialog stays open** with updated colors and live preview.
4. If any color is missing or invalid, show inline error on the textarea; do not close.

**Nested dialog rules:**

- Import `Dialog` is rendered **inside** the parent `DialogContent` (not a sibling at page root).
- Parent `onOpenChange` must ignore dismiss while import is open (or only close import first).
- Apply must not propagate a close event to the parent dialog.

Parser lives in WebOnOne feature code (`parseCssThemeVariables` in `features/settings/system-theme/utils/`); UI Kit does not own parsing logic.

**Parser contract:**

```typescript
type ParsedThemeColors = {
  color1: string
  color2: string
  color3: string
  color4: string
  color5: string
}

/** Returns null if any of --color-1..--color-5 is missing or not valid hex. */
function parseCssThemeVariables(input: string): ParsedThemeColors | null
```

Accept `--color-1` or `--color-1:` with optional spaces; values `#RGB` expanded to `#RRGGBB`. Ignore unrelated declarations in the pasted block.

### Select theme

- Click **Apply** or row select → `PATCH /me/preferences` → `ThemeProvider` applies immediately.
- No full page reload.

### Delete rules

- Confirm in **`Dialog`** (`size="sm"`) before delete.
- Cannot delete `is_system` themes.
- Cannot delete last remaining theme if it would leave user with no active theme (server enforces fallback to system default).

### Form validation (unchanged)

- Hex inputs stay in sync with color picker.
- Inline validation for invalid hex (Zod + field errors per `form-creation` skill).
- Save disabled while form invalid.

---

## Styled elements (must respond to theme)

| Element | Token source |
|---------|----------------|
| **Primary buttons** | Gradient `color1` → `color2` |
| **Secondary buttons** | Solid `color2` |
| **Destructive buttons** | Platform fixed red (not a palette slot) |
| **Links / active nav** | `color1` (`--primary`) |
| **Badges / callouts** | `color3` (`--accent`) |
| **Page / card background** | `color4` / `color5` by color mode |
| **Body / heading text** | `color5` / `color4` by color mode |
| **Inputs** | Border from text color; focus ring `color3` |
| **Scrollbars** | Thumb `color3` at 60% opacity; track from surface |

All mappings go through semantic tokens — components do not read `--color-N` directly except in theme package mapper.

---

## Redux / data loading

WebOnOne feature `features/settings/system-theme/`:

| Slice state | Source |
|-------------|--------|
| `themes[]` | `GET /themes` |
| `preferences` | `GET /me/preferences` |
| `status`, `error` | Epic async |

Epics follow `redux-store-and-epics.mdc`. On login success, load preferences and apply theme before rendering shell (or show brief loading state).

---

## Acceptance criteria

1. Platform Default theme exists after migration.
2. User creates theme via **create-theme dialog**; record appears in DB and list UI.
3. Create/edit dialog shows **live preview below** color fields; gradient primary button updates when `color1` or `color2` changes.
4. **Paste from CColorPalette** opens nested `sm` dialog; valid `:root` CSS block fills all five color fields **in the open create/edit dialog**; parent dialog remains open.
5. Hint text links to [CColorPalette](https://ccolorpalette.com/) for palette generation.
6. Selecting theme updates visible accents on Home and System Theme preview without reload; primary button shows `color1` → `color2` gradient.
7. Light/dark toggle swaps **color4** / **color5** for surfaces and text; brand slots (`color1`–`color3`) unchanged.
8. Preferences survive logout/login for same user.
9. Invalid hex rejected by API and form; incomplete CSS import shows error without closing import dialog.
