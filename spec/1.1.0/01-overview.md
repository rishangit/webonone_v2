# 01 — Overview (1.1.0)

## Vision

The platform adds a **Media microservice** that owns all file and image storage, folder management, and upload/delete operations. Other services (WebOnOne v2, Identity, and future services) **embed** Media’s upload/picker UI or call its REST API — they never store blobs in their own databases.

Media runs at **`media.webonone.com`** (local dev: `http://localhost:3003`).

## Goals (1.1.0)

1. **Media runs standalone** — own frontend, backend, MySQL database, and blob storage.
2. **Single and multiple upload** — API and embed UI support one file or many files per action.
3. **Folder creation and navigation** — scoped virtual folders per consumer service and resource.
4. **Embeddable upload window** — consumer apps open Media UI in an iframe with a **specific scope path**; results return via `postMessage`.
5. **Programmatic access** — authenticated REST API for upload, list, delete, and resolve public URLs without iframe.
6. **JWT trust** — Media backend verifies Identity-issued JWT locally; no per-request call to Identity.
7. **UI from UI Kit** — Media frontend uses `@webonone/ui-kit` only.

## Scope (1.1.0)

### In scope

- Media service scaffold: `media/frontend`, `media/backend`, `webonone_media`, migrations.
- Blob storage abstraction (local filesystem in dev; S3-compatible bucket in production).
- Virtual folder tree scoped by **`scope`** (see glossary).
- REST API: upload (single + batch), list, get metadata, delete, create folder, list folders.
- Embed routes: `/picker`, `/upload` — same routes as standalone; **embed mode** when `parentOrigin` is set (Identity pattern).
- `@webonone/media-embed` shared package: iframe URL builder, postMessage types, React hooks for consumers.
- WebOnOne v2 as **reference consumer** (embed picker + store returned `mediaUrl` / `mediaId` locally).
- Root `npm run dev:media` and inclusion in root `npm run dev`.

### Out of scope (1.1.0)

- Image transformation (resize, crop, WebP conversion) — future spec.
- CDN edge caching configuration — deployment concern; spec defines URL shape only.
- Virus scanning / content moderation pipeline.
- Media ownership ACL synced from consumer services via events — **deferred**; 1.1.0 trusts JWT + scope format + parentOrigin allowlist; consumer validates user access before opening embed.
- Replacing Identity avatar upload — Identity may consume Media in a later spec; 1.1.0 documents the contract only.

## Glossary

| Term | Definition |
|------|------------|
| **Media** | Standalone media microservice (`media/`) |
| **Scope** | Namespaced storage prefix owned by a consumer, e.g. `webonone:site:V7xK9mN2pQw3rTy4uIoP0` |
| **Folder path** | Path within a scope, e.g. `/images/banners` — combined with scope for storage key |
| **Embed mode** | Media route with `parentOrigin` query param — minimal layout + `postMessage` on selection/upload |
| **Media item** | One uploaded file record in `webonone_media` with public URL, metadata, and scope |
| **Picker** | Embed UI to browse folders, upload, select existing files, and confirm selection |
| **Consumer** | Any platform microservice that embeds Media or calls Media API (WebOnOne, Identity, …) |

## Scope naming convention

```text
{service}:{resourceType}:{resourceId}[/{optionalSubpath}]
```

Examples:

| Scope | Consumer | Meaning |
|-------|----------|---------|
| `webonone:site:abc123` | WebOnOne | All media for site `abc123` |
| `webonone:site:abc123/gallery` | WebOnOne | Gallery subfolder for site |
| `identity:user:xyz789/avatar` | Identity | User avatar slot (future) |

Media service stores the scope string as-is; it does **not** query WebOnOne or Identity databases to validate resource ownership. The **consumer** must only open the embed or call the API with scopes the current user is allowed to use.

## Success criteria

- `cd media && npm run dev` serves FE `:3003`, BE `:4003`, `/health`, and standalone `/upload`.
- WebOnOne embeds Media picker; user uploads one or many files; parent receives `postMessage` with `mediaId` + `url` for each item.
- Consumer can delete media via REST (`DELETE /api/v1/media/:id`) or inside embed UI; parent receives `webonone:media:deleted` when applicable.
- Media starts without Identity, WebOnOne, or other services running (upload requires valid JWT — degraded until user authenticates).
- No shared database; no blob columns in `webonone_db` or `identity_db`.
- Root `npm run dev` starts Media alongside existing services.
