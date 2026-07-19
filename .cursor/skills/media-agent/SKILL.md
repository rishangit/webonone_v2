---
name: media-agent
description: Media service agent for webonone-platform. Handles media/ frontend, backend, migrations, and packages/media-embed — upload, picker embed, blob storage, JWT verify. Use when tasks touch media/, Media API, or consumer embed integration.
---

# Media agent skill

## Scope

- `media/frontend`, `media/backend`, `media/backend/migrations`
- `packages/media-embed/` (shared iframe + postMessage contract)

Specs: `spec/1.1.0/03-media-project.md`, `spec/1.1.0/08-media-consumer-integration.md`

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3013 | `media/frontend/.env` |
| Backend | 4013 | `media/backend/.env` |

`JWT_SECRET` must match Identity backend.

## Rules

- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — media features use slice + epics for folder/picker/upload API I/O. For any standard list/detail CRUD, prefer `@webonone/store-kit` — see [feature-store skill](../feature-store/SKILL.md)

## Key paths

- Embed hooks: `media/frontend/src/features/media/hooks/`
- API routes: `media/backend/src/routes/`
- Storage: `media/backend/src/services/storage.service.ts`
- Shared contract: `packages/media-embed/src/`
- Standalone library list page: `media/frontend/src/features/media/pages/LibraryPage.tsx`
- Reusable folder browser: `media/frontend/src/features/media/components/ScopedFolderBrowser.tsx`

## List pages

Standalone Media collection pages use the UI Kit list page composition (`FeaturePage` + `ListPageBody` + `ItemList` + `Pagination`). `LibraryPage` is the reference; embed routes (`/selector`, `/picker`) keep `EmbedLayout` and may use inline loading overlays.

Rule: [feature-page-layout.mdc](../../rules/feature-page-layout.mdc) · Skill: [item-list](../item-list/SKILL.md).

## Host-level consumer dialogs

Media owns picker/upload/crop UI and postMessage contracts, but the consumer owns where the dialog chrome renders. When the consumer is an embedded peer under WebOnOne and the dialog should feel core-owned, use the platform host-dialog bridge from `platform-shell-navigation.mdc`: WebOnOne renders the host `CustomDialog`, Media runs inside its iframe, and the requesting peer receives result/cancel by `requestId`.

Reference: `webonone-v2/frontend/src/features/media/PlatformMediaDialogHost.tsx`.

## Verification

```bash
npm run type-check -w media-root
npm run migrate -w media-root
```

Consumer integration (WebOnOne demo): `webonone-v2/frontend/src/features/media/`
