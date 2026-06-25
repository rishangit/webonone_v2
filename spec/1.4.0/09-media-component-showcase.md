# 09 — Media component showcase (standalone app)

Media service **standalone app** shell and in-app demo page so developers can exercise each 1.4.0 embed surface without a consumer microservice.

## App shell

| Requirement | Detail |
|-------------|--------|
| Header | `AppShell` from `@webonone/ui-kit` with logged-in user **avatar** (Google account image from Identity `avatarUrl`) |
| Left navigation | Sidebar links: **Library**, **Components** |
| Auth | Same Identity redirect flow as 1.1.0; persist `avatarUrl` in `auth` slice |

Reference: `webonone-v2/frontend/src/app/AppLayout.tsx`.

## Components page (`/components`)

In-app showcase (not iframe) demonstrating embed contracts via `Media*Frame` components or direct route URLs.

### Media view section

| Requirement | Detail |
|-------------|--------|
| Initial image | Logged user's `avatarUrl` (fallback placeholder) |
| Viewer | 200×200 `MediaViewerFrame` or inline viewer |
| Mode toggle | **Separate button** switches `view` ↔ `edit` (in addition to double-click on image) |
| Edit affordance | In edit mode, **pencil icon centered** on the preview (not corner-only) |
| Edit action | Click pencil → open **selector** iframe scoped to `/root/users/{userId}/profile` |
| Folder bootstrap | If profile folder path missing, **create** nested folders before opening selector |
| Selector upload | Selector embed includes **desktop upload** dropzone; image pick opens **1:1 crop** (zoom + pan) before upload completes |
| Selection result | Selected or uploaded image updates the preview component |

### Media upload section

| Requirement | Detail |
|-------------|--------|
| Trigger | Button opens upload dialog iframe |
| Scope path | `folderPath=/root` |

### Media select section

| Requirement | Detail |
|-------------|--------|
| Trigger | **"Click me"** button opens selector iframe |
| Scope path | `folderPath=/root` |

## Library page demos

`LibraryPage` retains **LibraryEmbedDemos** (viewer, upload, selector buttons) per subtask *media project user should be able to show the each component*.

## Service mapping

| Area | Path |
|------|------|
| App layout | `media/frontend/src/app/AppLayout.tsx` |
| Nav config | `media/frontend/src/features/shell/config/navItems.ts` |
| Components page | `media/frontend/src/features/media/pages/ComponentShowcasePage.tsx` |
| Auth avatar | `media/frontend/src/features/auth/types/auth.types.ts`, `AuthCallbackPage.tsx` |
| Selector upload + crop | `media/frontend/src/features/media/pages/SelectorPage.tsx` |
| Folder bootstrap | `media/frontend/src/features/media/services/mediaApi.ts` (`ensureFolderPath`) |
| Centered edit icon | `media/frontend/src/features/media/components/MediaViewer.tsx` |

## Acceptance

- [ ] `npm run dev:media` — header shows user avatar after login
- [ ] Left nav switches Library ↔ Components
- [ ] Components page: view/edit toggle, centered edit icon, profile-folder selector with upload+crop
- [ ] Upload and selector sections open at `/root` as specified
