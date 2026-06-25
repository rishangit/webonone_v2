# 04 — Media Routes and API

Frontend routes and REST touchpoints for **1.4.0** embed surfaces. Backend behavior largely reuses 1.1.0; this doc lists deltas only.

---

## Frontend routes

Register in `media/frontend/src/app/router.tsx`:

| Path | Page | Embed query required |
|------|------|----------------------|
| `/upload-dialog` | `UploadDialogPage` | `parentOrigin`, `scope` |
| `/selector` | `SelectorPage` | `parentOrigin`, `scope`, `folderPath` |
| `/viewer` | `ViewerPage` | `parentOrigin`, `scope`, (`fileUrl` \| `mediaId`) |
| `/dialog` | `FullDialogPage` | `parentOrigin`, `scope`, `folderPath` |

Existing routes unchanged: `/picker`, `/upload`, `/library` (standalone).

### Query parameter reference

#### `/upload-dialog`

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `parentOrigin` | Yes (embed) | — | Consumer origin |
| `scope` | Yes | — | Storage scope |
| `folderPath` | No | `/` | Upload destination folder |
| `mediaType` | No | `all` | `image` \| `pdf` \| `all` |
| `accept` | No | derived | Overrides `mediaType` when set |
| `crop` | No | `false` | Enable image crop step |
| `defaultCropAspect` | No | `free` | Initial crop ratio |
| `maxFiles` | No | `1` | Batch limit |
| `maxSizeBytes` | No | server default | Per-file cap |
| `autoClose` | No | `true` | Parent may hide iframe on uploaded message |

#### `/selector`

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `parentOrigin` | Yes | — | Consumer origin |
| `scope` | Yes | — | Storage scope |
| `folderPath` | Yes | `/` | Scoped navigation root |
| `mode` | No | `single` | `single` \| `multiple` |
| `accept` | No | — | MIME filter for selectable files |

#### `/viewer`

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `parentOrigin` | Yes | — | Consumer origin |
| `scope` | Yes | — | Storage scope |
| `fileUrl` | One of | — | Public file URL |
| `mediaId` | One of | — | Resolve via GET media by id |
| `mode` | No | `view` | `view` \| `edit` |

#### `/dialog`

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `parentOrigin` | Yes | — | Consumer origin |
| `scope` | Yes | — | Storage scope |
| `folderPath` | Yes | `/` | Scoped navigation root |
| `selectable` | No | `false` | Enable selection + Confirm |
| `mode` | No | `single` | When `selectable=true` |
| `accept` | No | — | Filter selectable files |

---

## REST API (reuse 1.1.0)

No new endpoints required for MVP. Embeds call existing routes:

| Operation | Endpoint |
|-----------|----------|
| Upload (incl. cropped blob) | `POST /api/v1/media/upload` |
| Batch upload | `POST /api/v1/media/upload/batch` |
| List folder contents | `GET /api/v1/media?scope=&folderPath=` |
| Create folder | `POST /api/v1/folders` |
| Delete media | `DELETE /api/v1/media/:id` |
| Get item metadata | `GET /api/v1/media/:id` |
| Public file serve | `GET /files/:mediaId/:fileName` |

### Crop upload

Cropped image is uploaded as a normal multipart file. Optional query/body fields:

- `width`, `height` — dimensions after crop (client-provided; server may validate against image headers).

No server-side crop processing in 1.4.0 — crop is client-side only.

---

## Scoped navigation (server + client)

**Client:** `useScopedNavigation` clamps breadcrumb and parent-folder navigation to `initialFolderPath`.

**Server:** Existing list API returns children of requested `folderPath` only. Consumer must pass a `folderPath` the user is allowed to access; Media API validates scope string format and JWT.

---

## Environment (unchanged from 1.1.0)

```text
# media/frontend/.env.example
VITE_MEDIA_ORIGIN=          # not used internally — consumers set peer origin
VITE_API_BASE_URL=http://localhost:4003/api/v1
VITE_ALLOWED_PARENT_ORIGINS=http://localhost:3000,http://localhost:3001
VITE_ALLOWED_FRAME_ANCESTORS=http://localhost:3000 http://localhost:3001
```

Consumers add only:

```text
VITE_MEDIA_ORIGIN=http://localhost:3003
VITE_MEDIA_API_BASE_URL=http://localhost:4003/api/v1
```

Route URLs derived in `mediaConfig.ts` — no `VITE_MEDIA_UPLOAD_DIALOG_URL` etc.

---

## CSP and embed headers

Extend `frame-ancestors` to include all consumer origins that embed any of the four routes. Same header mechanism as 1.1.0 `/picker`.
