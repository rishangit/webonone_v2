# 02 — Identity Profile Page

Profile UX for **Identity** (`identity/frontend/src/features/profile/`).

---

## Modes

| Mode | Default | UI |
|------|---------|-----|
| **View** | Yes | Large profile image (centered or hero-style); field labels + read-only values; **Edit** button |
| **Edit** | No | Same image with **edit icon overlay** (centered); form inputs for editable fields; **Save** + **Cancel** |

Email address remains read-only in both modes (account identifier). Google-import hint shown when `isGoogleUser`.

---

## View mode layout

- **Profile image** — Minimum ~160×160 display (e.g. `Avatar size` custom or `w-40 h-40`); larger than previous side-by-side `lg` avatar.
- **Sections** — Account (image, display name, email, badges), Name, Contact, Address — same grouping as today but values as `<p>` / definition list, not `<Input>`.
- **Actions** — Single **Edit profile** button (UI Kit `Button`).

---

## Edit mode layout

- **Avatar editor** — Clickable region with image + centered **Pencil** or **Camera** icon overlay (visible only in edit mode).
- **On image click** — Open `ProfileMediaSelectorModal` (`CustomDialog` + `MediaSelectorFrame`).
- **Other fields** — Existing `FormField` + `Input` / `PhoneInput` controls (reuse current validation).
- **Actions** — **Save profile** (submit), **Cancel** (revert local state, return to view mode).

---

## Media selector integration

Follow [../1.4.0/08-media-consumer-integration.md](../1.4.0/08-media-consumer-integration.md).

### Config module

`identity/frontend/src/features/profile/utils/mediaConfig.ts`:

| Env | Purpose |
|-----|---------|
| `VITE_MEDIA_ORIGIN` | Media FE origin (dev default `http://localhost:3003`) |

Derived getters (not env):

- `getMediaSelectorUrl()` → `{origin}/selector`
- `getMediaOrigin()`
- `buildProfileMediaScope(userId)` → `identity:user:{userId}`
- `buildProfileFolderPath(userId)` → `/root/users/{userId}`

### Selector URL options

```typescript
buildMediaSelectorUrl({
  baseUrl: getMediaSelectorUrl(),
  parentOrigin: window.location.origin,
  scope: buildProfileMediaScope(user.id),
  folderPath: buildProfileFolderPath(user.id),
  mode: 'single',
  accept: 'image/*',
  selectorUpload: true,
  cropAspectPresets: ['1:1'],
})
```

### Handoff

- Parent passes JWT via `sendMediaInit` on iframe load (`accessToken` from Identity auth slice).
- On `webonone:media:select`, parent sets pending `avatarUrl` from `items[0].url` (preview only until Save).
- On Save, `PATCH /me` includes `avatarUrl` (backend already accepts optional `avatarUrl`).

### Crop rules

- Media selector upload path opens `ImageCropDialog` with **only** `1:1` preset when `cropAspectPresets=1:1` query param is set.
- User cannot switch to 16:9, free, or other ratios.

---

## State management

- Local `mode: 'view' | 'edit'` in `ProfilePage` or `ProfileForm`.
- On Cancel: reset form values from `user` prop; clear pending avatar; `mode = 'view'`.
- On successful save: Redux `profileUpdateSucceeded` refreshes `user`; `mode = 'view'`.

---

## Files (expected)

| File | Role |
|------|------|
| `pages/ProfilePage.tsx` | Mode toggle shell |
| `components/ProfileForm.tsx` | Orchestrates view vs edit |
| `components/ProfileView.tsx` | Read-only layout |
| `components/ProfileAvatarEditor.tsx` | Image + edit overlay |
| `components/ProfileMediaSelectorModal.tsx` | Dialog + `MediaSelectorFrame` |
| `utils/mediaConfig.ts` | Media origin + derived URLs |

---

## Dependencies

- Add `@webonone/media-embed` to `identity/frontend/package.json`.
- Chain `npm run build:media-embed` in `identity/package.json` `build` script.
- Vite alias for `@webonone/media-embed` → `packages/media-embed/src` (dev).
