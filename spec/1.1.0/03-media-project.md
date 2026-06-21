# 03 — Media Project

Standalone project: **frontend + backend + database + blob storage**. Must run without WebOnOne, Identity, or any other service.

Production host: **`media.webonone.com`**.

## Responsibilities

- **Upload** files and images — single file and batch (multiple files).
- **Create, rename, delete** virtual folders within a scope.
- **List** folders and media items with pagination.
- **Delete** media items (soft delete; blob removed asynchronously).
- **Serve** public file URLs (`/files/:mediaId/:fileName`).
- **Embed UI** for picker and upload-only flows (iframe from consumer apps).
- Own MySQL database **`webonone_media`** and blob storage volume/bucket.
- Verify Identity JWT locally on all authenticated API routes.

## Folder layout

```text
media/
  frontend/                         # React SPA — port 3003
    src/
      app/
        router.tsx
        store/
      features/
        media/
          pages/
            PickerPage.tsx          # browse + select (+ embed mode)
            UploadPage.tsx          # upload-only (+ embed mode)
            LibraryPage.tsx         # standalone full library manager
          components/
            MediaPicker.tsx         # folder tree + grid + upload dropzone
            MediaGrid.tsx
            FolderTree.tsx
            UploadDropzone.tsx        # single + multiple drag-and-drop
            EmbedLayout.tsx           # minimal chrome for iframe
          hooks/
            useEmbedMode.ts           # parentOrigin, scope, mode, accept
            useMediaAuth.ts           # JWT from handoff / parent init
            useMediaPostMessage.ts    # post to parentOrigin
          services/
            mediaApi.ts
          schemas/
            mediaSchemas.ts
          store/
      shared/
        services/apiClient.ts
      main.tsx
  backend/
    src/
      routes/
        media.routes.ts
        folders.routes.ts
        files.routes.ts             # public file serving
        health.routes.ts
      controllers/
      services/
        storage.service.ts          # local FS / S3 adapter
        media.service.ts
        folder.service.ts
      middleware/
        auth.ts                     # verify Identity JWT
        validateBody.ts
      models/
      app.ts
      server.ts
    migrations/
  package.json
```

Each page is **one route**; embed behavior is a **mode** inside that page (same pattern as Identity `LoginPage`).

## Embed mode (single route)

When `parentOrigin` is present in the URL query string, the page runs in **embed mode**:

| Signal | Meaning |
|--------|---------|
| `parentOrigin` query param present | Embed mode — minimal layout, `postMessage` on action |
| `parentOrigin` absent | Standalone mode — full `PageShell` + `AppHeader` |

### Embed query params

| Param | Required | Description |
|-------|----------|-------------|
| `parentOrigin` | Yes (embed) | Consumer origin for `postMessage` target and CSP |
| `scope` | Yes | Storage scope path (see [01-overview.md](./01-overview.md#glossary)) |
| `mode` | No | `single` (default) or `multiple` — max selectable items |
| `accept` | No | MIME filter, e.g. `image/*`, `video/*`, `*/*` (default) |
| `folderPath` | No | Initial folder within scope, e.g. `/banners` |
| `maxFiles` | No | Upload cap per batch (default `10`, max `50`) |
| `maxSizeBytes` | No | Per-file size limit (default from server config) |

**Example URLs**

```text
Standalone:  http://localhost:3003/library
Embedded:    http://localhost:3003/picker?parentOrigin=http://localhost:3000&scope=webonone:site:abc123&mode=multiple&accept=image/*
Upload embed: http://localhost:3003/upload?parentOrigin=http://localhost:3000&scope=webonone:site:abc123/images&mode=single
```

### PickerPage structure

```text
PickerPage.tsx
  ├── useEmbedMode()           → { isEmbed, parentOrigin, scope, mode, accept, folderPath }
  ├── useMediaAuth()           → JWT for API calls
  ├── Layout                   → EmbedLayout (embed) | PageShell (standalone)
  ├── MediaPicker              → folder tree, grid, UploadDropzone
  └── onConfirm (embed):
        └── postMessage({ type: 'webonone:media:select', items: [...] }, parentOrigin)
```

UploadPage follows the same pattern; posts `webonone:media:uploaded` after successful upload(s) without requiring Confirm.

## Database (`webonone_media`)

All primary keys `CHAR(21)` nanoid. No FK to other services' tables.

### `media_folders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) PK | nanoid |
| `scope` | VARCHAR(255) | e.g. `webonone:site:abc123` |
| `path` | VARCHAR(512) | Path within scope, e.g. `/gallery/thumbs` |
| `name` | VARCHAR(255) | Display name (last segment) |
| `created_by_user_id` | CHAR(21) | Identity `sub` — no FK |
| `created_at`, `updated_at` | DATETIME(3) | UTC |
| `deleted_at` | DATETIME(3) NULL | Soft delete |

Unique index: `(scope, path)` where `deleted_at IS NULL`.

### `media_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) PK | nanoid — used in public URL |
| `scope` | VARCHAR(255) | Same as folder scope |
| `folder_path` | VARCHAR(512) | Folder path within scope (default `/`) |
| `file_name` | VARCHAR(255) | Original file name |
| `storage_key` | VARCHAR(512) | Internal blob key — not exposed to consumers |
| `mime_type` | VARCHAR(127) | e.g. `image/png` |
| `size_bytes` | BIGINT UNSIGNED | File size |
| `width`, `height` | INT NULL | Images only — extracted on upload |
| `public_url` | VARCHAR(1024) | Denormalized CDN URL |
| `uploaded_by_user_id` | CHAR(21) | Identity `sub` |
| `created_at`, `updated_at` | DATETIME(3) | UTC |
| `deleted_at` | DATETIME(3) NULL | Soft delete |

Indexes: `(scope, folder_path, deleted_at)`, `(uploaded_by_user_id)`.

### `media_upload_sessions` (optional, batch tracking)

| Column | Type | Notes |
|--------|------|-------|
| `id` | CHAR(21) PK | Session id returned in batch upload response |
| `scope` | VARCHAR(255) | |
| `user_id` | CHAR(21) | |
| `expected_count` | INT | |
| `completed_count` | INT | |
| `status` | VARCHAR(32) | `pending`, `completed`, `failed` |
| `created_at` | DATETIME(3) | |

## Blob storage

Abstracted behind `storage.service.ts`:

| Environment | Backend | Path / bucket |
|-------------|---------|---------------|
| Local dev | Filesystem | `media/backend/storage/` (gitignored) |
| Production | S3-compatible | `MEDIA_S3_BUCKET` env |

Storage key format:

```text
{scope}/{folderPath}/{mediaId}/{sanitizedFileName}
```

Files are written **after** DB row insert in a transaction; on storage failure, row is marked failed and rolled back.

## Backend API (`/api/v1`)

All routes except `/health` and public file serving require `Authorization: Bearer <JWT>`.

### Media items

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/media/upload` | Single file upload (`multipart/form-data`) |
| `POST` | `/media/upload/batch` | Multiple files — field name `files[]` |
| `GET` | `/media` | List items in scope + folder (query params) |
| `GET` | `/media/:id` | Get one item metadata |
| `DELETE` | `/media/:id` | Soft delete item + queue blob removal |
| `GET` | `/files/:id/:fileName` | **Public** — stream file bytes (no auth in 1.1.0) |

### Folders

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/folders` | Create folder `{ scope, path, name }` |
| `GET` | `/folders` | List folders in scope (query: `scope`, optional `parentPath`) |
| `PATCH` | `/folders/:id` | Rename folder |
| `DELETE` | `/folders/:id` | Soft delete if empty |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | `{ status: 'ok', service: 'media' }` |

### Query params — `GET /media`

| Param | Required | Description |
|-------|----------|-------------|
| `scope` | Yes | Scope string |
| `folderPath` | No | Default `/` |
| `page` | No | Default `1` |
| `pageSize` | No | Default `24`, max `100` |
| `mimeType` | No | Filter prefix, e.g. `image/` |

### `POST /media/upload` — single

**Request:** `multipart/form-data`

| Field | Required | Description |
|-------|----------|-------------|
| `file` | Yes | One file |
| `scope` | Yes | Scope string |
| `folderPath` | No | Default `/` |

**Response `201`:**

```json
{
  "item": {
    "id": "V7xK9mN2pQw3rTy4uIoP0",
    "scope": "webonone:site:abc123",
    "folderPath": "/gallery",
    "fileName": "hero.png",
    "mimeType": "image/png",
    "sizeBytes": 245760,
    "width": 1920,
    "height": 1080,
    "url": "http://localhost:4003/api/v1/files/V7xK9mN2pQw3rTy4uIoP0/hero.png",
    "createdAt": "2026-06-21T10:00:00.000Z"
  }
}
```

### `POST /media/upload/batch` — multiple

**Request:** `multipart/form-data`

| Field | Required | Description |
|-------|----------|-------------|
| `files` | Yes | Multiple files (same field name repeated or `files[]`) |
| `scope` | Yes | |
| `folderPath` | No | |

**Response `201`:**

```json
{
  "sessionId": "Abc123Xyz789Def456Ghi",
  "items": [ { "id": "...", "url": "...", "fileName": "...", "mimeType": "...", "sizeBytes": 0 } ],
  "failed": [ { "fileName": "bad.exe", "reason": "MIME type not allowed" } ]
}
```

Partial success is allowed — successful items are persisted; failed items appear in `failed` array.

### `DELETE /media/:id`

**Response `200`:**

```json
{
  "id": "V7xK9mN2pQw3rTy4uIoP0",
  "deleted": true
}
```

### `POST /folders`

**Request:**

```json
{
  "scope": "webonone:site:abc123",
  "path": "/gallery/new-folder",
  "name": "new-folder"
}
```

**Response `201`:** folder DTO with `id`, `scope`, `path`, `name`, `createdAt`.

## Validation rules

| Rule | Value (configurable) |
|------|---------------------|
| Max single file size | 25 MB default (`MEDIA_MAX_FILE_SIZE_BYTES`) |
| Max batch file count | 50 |
| Allowed MIME types | `image/*`, `video/*`, `application/pdf`, `text/plain` (config list) |
| Scope format | Regex: `^[a-z0-9-]+:[a-z0-9-]+:[A-Za-z0-9_-]+(/[A-Za-z0-9_/-]*)?$` |
| Scope max length | 255 characters |

## Auth middleware

Same contract as WebOnOne ([07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md#layer-3--jwt-between-backends)):

1. Verify JWT signature (`JWT_SECRET` or public key).
2. Validate `iss: webonone-identity`, `aud: webonone-api`, `exp`.
3. Set `req.user = { id: sub, email }`.
4. **Do not** query `identity_db`.

## Frontend routes

| Path | Page | Standalone | Embed (with `parentOrigin`) |
|------|------|------------|------------------------------|
| `/library` | LibraryPage | Full library manager | N/A — use `/picker` for embed |
| `/picker` | PickerPage | Full layout + confirm | Minimal layout + `postMessage` on confirm |
| `/upload` | UploadPage | Full layout | Minimal layout + `postMessage` on each upload batch |

## UI dependency

```tsx
import { Button, PageShell, AppHeader } from '@webonone/ui-kit'
```

Upload dropzone and grid are Media-specific components built on UI Kit primitives.

## Environment

Per [microservice-architecture.mdc](../../.cursor/rules/microservice-architecture.mdc) — separate env files per layer.

### Backend (`media/backend/.env`)

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `mysql://.../webonone_media` | MySQL connection |
| `JWT_SECRET` | shared dev secret | Same as Identity + WebOnOne |
| `PORT` | `4003` | API port |
| `MEDIA_STORAGE_DRIVER` | `local` \| `s3` | Storage backend |
| `MEDIA_LOCAL_STORAGE_PATH` | `./storage` | Local dev path |
| `MEDIA_S3_BUCKET` | — | Production bucket |
| `MEDIA_S3_REGION` | — | S3 region |
| `MEDIA_PUBLIC_BASE_URL` | `http://localhost:4003/api/v1` | Prefix for `public_url` |
| `MEDIA_MAX_FILE_SIZE_BYTES` | `26214400` | 25 MB |
| `MEDIA_ALLOWED_MIME_TYPES` | `image/*,video/*,application/pdf` | Comma-separated |
| `ALLOWED_PARENT_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Embed postMessage allowlist |

### Frontend (`media/frontend/.env`)

| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:4003/api/v1` | Media API |
| `VITE_IDENTITY_ORIGIN` | `http://localhost:3001` | Login redirect target |
| `VITE_IDENTITY_API_BASE_URL` | `http://localhost:4001/api/v1` | Auth code exchange |
| `VITE_ALLOWED_PARENT_ORIGINS` | `http://localhost:3000` | Validate parentOrigin in embed mode |
| `VITE_ALLOWED_FRAME_ANCESTORS` | `http://localhost:3000 http://localhost:3001` | CSP `frame-ancestors` |

## Monorepo wiring

When scaffolding:

1. Add `media/package.json` with `dev` script (FE + BE via `concurrently`).
2. Register workspaces: `media`, `media/frontend`, `media/backend`.
3. Root `dev:media` → `npm run dev -w media-root`.
4. Append `dev:media` to root `npm run dev` concurrently command.
5. Add `packages/media-embed/` as `@webonone/media-embed`.

## Standalone run

```bash
cd media
npm run dev
```

Must serve:

- `http://localhost:3003/picker?parentOrigin=...&scope=...` (embed mode)
- `http://localhost:3003/library` (standalone)
- `http://localhost:4003/api/v1/health`
- Public file URLs under `/api/v1/files/:id/:fileName`

## Acceptance criteria

1. User can upload **one file** via API and embed UI; response includes `id` and `url`.
2. User can upload **multiple files** in one batch; partial failures reported per file.
3. User can **create folders**, navigate folder tree, and list media in a scope.
4. User can **delete** media via API and embed UI.
5. Consumer iframe at `/picker` receives `webonone:media:select` with selected items on Confirm.
6. Consumer iframe at `/upload` receives `webonone:media:uploaded` after upload completes.
7. Media starts standalone; `/health` returns 200 without other services.
8. All authenticated routes reject missing/invalid JWT without calling Identity BE.
9. No blob data in consumer databases — only `media_id` + `url` references.
10. UI built with `@webonone/ui-kit` primitives.
