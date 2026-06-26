# 01 — Overview (1.5.0)

## Vision

The **Identity profile page** becomes a polished account settings experience: users land in **read-only view mode** with a prominent profile photo and labeled field values, then switch to **edit mode** to change details and pick a new avatar through the **Media selector** embed (owned UI from the Media service). The temporary WebOnOne **media demo** page is removed now that real profile integration ships in Identity.

## Goals (1.5.0)

1. **View mode (default)** — Larger profile image; all profile fields displayed as plain text (not inputs); email and verification badges visible.
2. **Edit mode** — Toggle via **Edit** button; form controls for editable fields; profile image shows centered **edit icon** overlay; clicking opens Media **selector** dialog.
3. **Avatar via Media** — Selector scoped to `folderPath=/root/users/{userId}`; `selectorUpload=true` with **1:1 crop only** (user cannot change aspect ratio).
4. **Persist avatar** — On image selection, set pending `avatarUrl` from Media item URL; include in profile save (`PATCH /me`).
5. **WebOnOne cleanup** — Remove `Media demo` nav item and `/demo/media` route (and orphaned demo-only components if unused elsewhere).

## Scope (1.5.0)

### In scope

- `identity/frontend` profile page refactor (`ProfilePage`, `ProfileForm`, new view subcomponents).
- `identity/frontend` Media consumer: `mediaConfig.ts`, `ProfileAvatarEditor`, `ProfileMediaSelectorModal`.
- `identity/frontend/.env.example` — `VITE_MEDIA_ORIGIN` (and API base if needed for future).
- Identity build chain — `@webonone/media-embed` dependency + Vite alias; root `build:media-embed` in identity `build` script.
- Media selector query param `cropAspectPresets` (comma-separated) to lock crop UI to allowed ratios.
- `packages/media-embed` — `cropAspectPresets` on `BuildMediaSelectorUrlOptions` + URL builder.
- WebOnOne — remove nav entry, route, `MediaDemoPage`, and demo-only embed wrappers if nothing else imports them.

### Out of scope (1.5.0)

- Identity backend schema changes (`avatar_url` already exists).
- WebOnOne site editor media fields (future spec).
- Embed mode for Identity profile (standalone + return URL only).
- Media full dialog, viewer, or upload-dialog for profile (selector only per story).

## Glossary

| Term | Definition |
|------|------------|
| **View mode** | Read-only profile UI; default on page load |
| **Edit mode** | Editable form + avatar edit affordance |
| **Profile folder** | Media virtual path `/root/users/{userId}` within consumer `scope` |
| **Locked crop** | Crop dialog shows only `1:1` preset; no ratio selector for other aspects |

## Success criteria

1. `/profile` loads in view mode; **Edit** switches to edit mode; **Cancel** returns to view without saving.
2. View mode shows profile image larger than the previous `Avatar size="lg"` inline header.
3. Edit mode: pencil/edit icon centered on image; click opens selector modal; selection updates preview; **Save** persists `avatarUrl` and other fields.
4. Selector embed uses `folderPath=/root/users/{userId}`, `accept=image/*`, `selectorUpload=true`, `cropAspectPresets=1:1`.
5. WebOnOne has no `Media demo` in navigation; `/demo/media` returns 404 or redirects to home.
6. `npm run type-check -w identity-root` and `npm run type-check -w webonone-v2-root` pass.

## Subtask mapping (ClickUp)

| Subtask | ID | Spec section |
|---------|-----|----------------|
| Parent — profile view/edit + media selector + remove demo | 86ey2n76k | [02](./02-identity-profile-page.md), [03](./03-webonone-cleanup.md) |
