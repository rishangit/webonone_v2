# 01 — Overview (1.4.0)

## Vision

Media becomes a **complete embeddable UI platform** for file operations. Consumer microservices (WebOnOne, future services) open purpose-built iframe surfaces — upload with optional crop, lightweight file picker, inline viewer with edit affordance, or a full scoped library dialog — instead of building local upload forms or duplicating folder navigation.

All surfaces follow the **1.1.0 embed contract**: `parentOrigin` query param, JWT via `webonone:media:init` postMessage, results via typed postMessage back to the parent. No tokens in URLs; no shared databases.

## Goals (1.4.0)

1. **File Upload iframe** — trigger from consumer; upload from device (desktop or mobile); caller specifies media type (`image`, `pdf`, `all`); optional image crop with aspect-ratio toolbar before upload completes.
2. **File Selector iframe** — modal-style picker scoped to a folder path; single selection returns file path/URL to the caller immediately (no separate Confirm step unless `mode=multiple`).
3. **Media Viewer iframe** — display a file by URL in `view` or `edit` mode; edit mode shows an overlay edit control that opens the file selector.
4. **Full Media Dialog iframe** — embeddable library manager: toolbar (create folder, upload), folders listed before files, double-click to navigate within the scoped subtree only.
5. **`@webonone/media-embed`** — one package surface for URL building, message types, and React hooks for all four embed types.
6. **Standalone Media** — each route runs without consumers; embed mode is a flag on the same pages (same pattern as Identity login and 1.1.0 `/picker`).

## Scope (1.4.0)

### In scope

- Four new or extended Media frontend routes: `/upload-dialog`, `/selector`, `/viewer`, `/dialog` (exact paths in [04-media-routes-and-api.md](./04-media-routes-and-api.md)).
- Image crop step when `crop=true` on upload embed: crop dialog with ratio presets (1:1, 1:2, 2:1, 16:9, 4:3, free).
- Scoped folder navigation: consumer passes `folderPath` (and `scope`) — user cannot navigate above the given root within that embed.
- postMessage contracts for upload complete, select, cancel, and viewer edit result.
- Extensions to `packages/media-embed/` (builders, types, hooks, optional frame components).
- WebOnOne v2 reference consumer adoption for at least one new surface (viewer or selector).

### Out of scope (1.4.0)

- Replacing existing `/picker` and `/upload` routes — they remain; new routes address finer-grained embed use cases.
- Video transcoding, PDF in-browser editing, or collaborative real-time editing.
- Backend schema changes beyond what 1.1.0 already supports (folders, upload, list, delete).
- Identity avatar upload consumer flow (future spec).
- Gateway/BFF aggregation of Media APIs.
- Events (`MediaDeleted` async sync) — still optional per 1.1.0.

## Glossary

| Term | Definition |
|------|------------|
| **Embed surface** | One Media FE route designed for iframe embedding (`parentOrigin` present) |
| **Scope** | Storage namespace string (e.g. `webonone:site:{id}/gallery`) — unchanged from 1.1.0 |
| **Folder path** | Virtual path within scope (e.g. `/`, `/banners`, `/user/{userId}`) |
| **Scoped root** | The `folderPath` passed by the consumer; navigation is limited to this folder and its descendants |
| **Media type preset** | Caller filter: `image` (image/*), `pdf` (application/pdf), `all` (no extra MIME filter beyond `accept`) |
| **Crop mode** | Upload flow pauses after file pick to show crop UI before POST upload |
| **View mode** | Viewer shows thumbnail/icon or inline image for the given file URL |
| **Edit mode** | Viewer shows edit affordance; click opens selector iframe or inline selector overlay |
| **Full media dialog** | Combined browse + toolbar + navigation within scoped subtree |

## Success criteria

1. Consumer opens each embed via `buildMedia*EmbedUrl()` from `@webonone/media-embed`; iframe loads in embed layout without full app chrome.
2. Upload embed accepts files from device file picker and drag-and-drop on mobile and desktop; respects `mediaType` and optional `crop` + `cropAspect`.
3. Selector embed opens at consumer-specified `folderPath`; selecting a file posts `webonone:media:select` (or dedicated selector message) with `items[0]` path/URL.
4. Viewer embed renders image preview or file-type icon for `fileUrl`; edit mode opens selector and returns updated selection to parent.
5. Full dialog embed lists folders first, then files; double-click enters folder; toolbar creates folder and opens upload; navigation cannot escape scoped root.
6. JWT handoff and origin checks pass the security checklist in [08-media-consumer-integration.md](./08-media-consumer-integration.md).
7. `npm run build -w @webonone/media-embed` and `npm run build -w media-root` succeed; Media runs standalone via `npm run dev:media`.

## Subtask mapping (ClickUp)

| Subtask | Spec section |
|---------|----------------|
| File Upload iframe — device upload + media type filter | [02-media-iframe-components.md](./02-media-iframe-components.md#1-file-upload-iframe) |
| File Upload iframe — image crop dialog + aspect ratio toolbar | [02-media-iframe-components.md](./02-media-iframe-components.md#crop-flow) |
| File Selector dialog iframe — scoped folder path + selection callback | [02-media-iframe-components.md](./02-media-iframe-components.md#2-file-selector-iframe) |
| Media Viewer iframe — view mode | [02-media-iframe-components.md](./02-media-iframe-components.md#3-media-viewer-iframe) |
| Media Viewer iframe — edit mode + open file selector on edit | [02-media-iframe-components.md](./02-media-iframe-components.md#edit-mode) |
| Full Media Dialog iframe — embed entry + scoped root path | [02-media-iframe-components.md](./02-media-iframe-components.md#4-full-media-dialog-iframe) |
| Full Media Dialog — toolbar + folder navigation | [02-media-iframe-components.md](./02-media-iframe-components.md#toolbar-and-navigation) |
| `@webonone/media-embed` contracts | [03-media-embed-package.md](./03-media-embed-package.md) |
| Create feature branch | [07-implementation-plan.md](./07-implementation-plan.md) |
