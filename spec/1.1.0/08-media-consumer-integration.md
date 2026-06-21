# 08 — Media ↔ Consumer Integration

Authoritative guide for connecting **Media** to **WebOnOne v2**, **Identity**, and future microservices.

Related: [02-architecture.md](./02-architecture.md), [03-media-project.md](./03-media-project.md), [07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md), `microservice-architecture.mdc`.

## Three connection layers

| Layer | Channel | Used for |
|-------|---------|----------|
| **1 — UI embed** | `<iframe>` + query params | Open Media picker/upload at specific scope path |
| **2 — Browser handoff** | `window.postMessage` + origin checks | Return selected/uploaded/deleted media to parent |
| **3 — API auth** | `Authorization: Bearer <JWT>` | Direct REST upload/list/delete from consumer |
| **4 — Async sync** | Versioned events (optional) | `MediaDeleted` → consumer removes local reference |

```text
Layer 1–2 (browser):  Consumer FE ──iframe──► Media FE ──postMessage──► Consumer FE
Layer 3 (API):          Consumer FE ──Bearer JWT──► Media BE (verify locally)
Layer 3 (API):          Consumer BE ──Bearer JWT──► Media BE (server-side upload, optional)
Layer 4 (async):        Media BE ──MediaDeleted──► Consumer BE (future)
```

**Never:** shared database, blobs in consumer DB, JWT in URL query/hash, or Media BE calling Identity BE per request.

---

## Shared package — `@webonone/media-embed`

Location: `packages/media-embed/`

Provides typed contracts and React helpers so consumers do not duplicate iframe/postMessage logic.

### Exports

| Export | Purpose |
|--------|---------|
| `buildMediaEmbedUrl()` | Build iframe `src` from base URL + embed params |
| `MEDIA_MESSAGE_TYPES` | Constant message type strings |
| `MediaItemDto` | TypeScript type for media item in messages |
| `useMediaEmbedMessage()` | Hook — listen for Media postMessages in parent |
| `useMediaPickerFrame()` | Hook — open/close picker modal state |
| `MediaPickerFrame` | Optional ready-made iframe component |
| `sendMediaInit()` | Parent → iframe init message with JWT |

### Build embed URL

```typescript
import { buildMediaEmbedUrl } from '@webonone/media-embed'

const src = buildMediaEmbedUrl({
  baseUrl: import.meta.env.VITE_MEDIA_PICKER_URL, // http://localhost:3003/picker
  parentOrigin: window.location.origin,
  scope: `webonone:site:${siteId}/gallery`,
  mode: 'multiple',
  accept: 'image/*',
  folderPath: '/banners',
})
```

---

## Layer 1 — Iframe embed

Consumer renders Media UI in an iframe (modal or inline panel).

### Consumer setup (WebOnOne example)

```text
webonone-v2/frontend/src/features/media/
  components/MediaPickerModal.tsx    # modal + MediaPickerFrame
  hooks/useMediaSelection.ts         # wraps useMediaEmbedMessage
```

### Iframe URL contract

| Query param | Required | Description |
|-------------|----------|-------------|
| `parentOrigin` | Yes | Consumer origin — enables embed mode and postMessage target |
| `scope` | Yes | Storage scope (see [01-overview.md](./01-overview.md#scope-naming-convention)) |
| `mode` | No | `single` (default) or `multiple` |
| `accept` | No | MIME filter |
| `folderPath` | No | Initial folder within scope |
| `maxFiles` | No | Batch upload limit |
| `maxSizeBytes` | No | Per-file size cap |

Media routes:

| Route | Purpose |
|-------|---------|
| `GET /picker` | Browse, upload, select existing, Confirm |
| `GET /upload` | Upload-only; auto-notify parent on success |

### Scope path examples (WebOnOne)

| Use case | Scope |
|----------|-------|
| Site hero image | `webonone:site:{siteId}/hero` |
| Page gallery | `webonone:site:{siteId}/pages/{pageId}/gallery` |
| Global assets | `webonone:account:{accountId}/assets` |

**Consumer responsibility:** validate the current user owns `siteId` / `accountId` **before** opening the iframe with that scope.

---

## Layer 2 — postMessage contract

All messages use typed `type` field prefix `webonone:media:`.

### Parent → Media iframe (init)

Sent after iframe `load` so Media FE can authenticate API calls without login redirect inside iframe:

```json
{
  "type": "webonone:media:init",
  "accessToken": "<jwt>"
}
```

| Owner | Responsibility |
|-------|----------------|
| Consumer parent | Send only to `MEDIA_ORIGIN`; include valid JWT from Redux auth slice |
| Media iframe | Validate `event.origin` against `VITE_ALLOWED_PARENT_ORIGINS`; store token in memory |

**Security:** Token is sent via postMessage, not URL. Parent must target iframe `contentWindow` with Media origin.

### Media → Parent (selection confirm)

Posted when user clicks **Confirm** in `/picker` embed mode:

```json
{
  "type": "webonone:media:select",
  "scope": "webonone:site:abc123/gallery",
  "items": [
    {
      "id": "V7xK9mN2pQw3rTy4uIoP0",
      "url": "https://media.webonone.com/files/V7xK9mN2pQw3rTy4uIoP0/hero.png",
      "fileName": "hero.png",
      "mimeType": "image/png",
      "sizeBytes": 245760,
      "width": 1920,
      "height": 1080
    }
  ]
}
```

### Media → Parent (upload complete)

Posted from `/upload` embed (and optionally from `/picker` after inline upload):

```json
{
  "type": "webonone:media:uploaded",
  "scope": "webonone:site:abc123/gallery",
  "items": [ { "id": "...", "url": "...", "fileName": "...", "mimeType": "...", "sizeBytes": 0 } ]
}
```

### Media → Parent (delete)

Posted when user deletes item inside embed UI:

```json
{
  "type": "webonone:media:deleted",
  "scope": "webonone:site:abc123/gallery",
  "ids": ["V7xK9mN2pQw3rTy4uIoP0"]
}
```

### Media → Parent (cancel)

User closes picker without confirming:

```json
{
  "type": "webonone:media:cancel"
}
```

### Parent listener rules

Consumer parent **must**:

- Listen with `window.addEventListener('message', ...)`.
- Accept messages only if `event.origin === MEDIA_ORIGIN` (from env).
- Accept only `event.data.type` values from the contract above.
- In `single` mode, use first item only from `select` / `uploaded` messages.

Media embed pages **must**:

- Detect embed mode when `parentOrigin` query param is present.
- Use minimal `EmbedLayout` (no full app chrome).
- Send `postMessage` only to `parentOrigin` from query string — **never `'*'`**.
- Listen for `webonone:media:init` from validated parent origins only.

---

## Layer 3 — REST API (direct)

Consumers may call Media API without iframe when UI embed is not needed (e.g. programmatic upload from consumer backend).

### From consumer frontend

```http
POST /api/v1/media/upload HTTP/1.1
Host: localhost:4003
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file=<binary>&scope=webonone:site:abc123&folderPath=/gallery
```

```http
GET /api/v1/media?scope=webonone:site:abc123&folderPath=/gallery HTTP/1.1
Host: localhost:4003
Authorization: Bearer <accessToken>
```

```http
DELETE /api/v1/media/V7xK9mN2pQw3rTy4uIoP0 HTTP/1.1
Host: localhost:4003
Authorization: Bearer <accessToken>
```

### From consumer backend (optional)

Server-side upload uses the **user's JWT** forwarded from FE, or a service token pattern in a future spec. **1.1.0:** consumer BE does not hold a shared service secret; all Media calls use the end-user JWT.

### Storing references in consumer DB

WebOnOne example table in `webonone_db`:

```sql
CREATE TABLE site_media_refs (
  id         CHAR(21)     NOT NULL PRIMARY KEY,
  site_id    CHAR(21)     NOT NULL,
  media_id   CHAR(21)     NOT NULL,   -- copy from Media service — no FK
  media_url  VARCHAR(1024) NOT NULL,  -- denormalized for display
  label      VARCHAR(255) NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_site_media_refs_site_id (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Layer 4 — Events (async, optional)

When consumer must react to deletes initiated outside its UI (e.g. standalone Media library):

```json
{
  "eventVersion": "1.0",
  "eventType": "MediaDeleted",
  "eventId": "<nanoid>",
  "occurredAt": "2026-06-21T10:00:00.000Z",
  "payload": {
    "mediaId": "V7xK9mN2pQw3rTy4uIoP0",
    "scope": "webonone:site:abc123/gallery",
    "deletedByUserId": "V7xK9mN2pQw3rTy4uIoP0"
  }
}
```

Consumer handler: idempotent — remove local `site_media_refs` row if present. **Not required for 1.1.0 MVP** if consumers always delete via their own UI calling Media API.

---

## End-to-end sequence — WebOnOne image picker

```text
1. User edits site in WebOnOne (authenticated, JWT in Redux)
2. User clicks "Add images" → MediaPickerModal opens
3. WebOnOne renders iframe:
     http://localhost:3003/picker?parentOrigin=http://localhost:3000&scope=webonone:site:abc123&mode=multiple&accept=image/*
4. iframe load → WebOnOne posts webonone:media:init { accessToken }
5. User drags 3 images into dropzone → Media FE → Media BE POST /media/upload/batch
6. User selects 2 existing images → clicks Confirm
7. Media posts webonone:media:select { items: [5 items total] } to parentOrigin
8. WebOnOne validates origin, maps items to form state
9. On site save → WebOnOne BE stores media_id + url in site_media_refs (webonone_db)
10. WebOnOne FE renders <img src={item.url} /> from Media public URL
```

---

## End-to-end sequence — delete

```text
1. User removes image in WebOnOne editor
2. WebOnOne FE → DELETE /api/v1/media/:id (Bearer JWT) OR user deletes inside embed
3. Media soft-deletes row, removes blob
4. WebOnOne FE removes from local state; on save, deletes site_media_refs row
5. (Optional) Media publishes MediaDeleted event → WebOnOne consumer cleans orphan refs
```

---

## Security checklist

| # | Requirement | Owner |
|---|-------------|-------|
| 1 | `parentOrigin` validated against allowlist before embed mode | Media FE |
| 2 | `Content-Security-Policy: frame-ancestors` on Media FE | Media FE |
| 3 | `event.origin === MEDIA_ORIGIN` on parent listener | Consumer FE |
| 4 | postMessage target is specific `parentOrigin` — never `'*'` | Media FE |
| 5 | JWT never in iframe URL query or hash | Both FEs |
| 6 | `webonone:media:init` token accepted only from allowlisted parent origins | Media FE |
| 7 | Verify `iss`, `aud`, `exp` on Media API | Media BE |
| 8 | Consumer validates user owns scope before opening embed | Consumer FE/BE |
| 9 | Scope format validated on Media API | Media BE |
| 10 | No shared media tables across services | All BEs |

---

## Environment reference

### Media

```text
# media/backend
JWT_SECRET=<dev-shared>
ALLOWED_PARENT_ORIGINS=http://localhost:3000,http://localhost:3001
MEDIA_PUBLIC_BASE_URL=http://localhost:4003/api/v1

# media/frontend
VITE_API_BASE_URL=http://localhost:4003/api/v1
VITE_ALLOWED_PARENT_ORIGINS=http://localhost:3000,http://localhost:3001
VITE_ALLOWED_FRAME_ANCESTORS=http://localhost:3000 http://localhost:3001
```

### WebOnOne consumer

```text
# webonone-v2/frontend
VITE_MEDIA_ORIGIN=http://localhost:3003
VITE_MEDIA_PICKER_URL=http://localhost:3003/picker
VITE_MEDIA_UPLOAD_URL=http://localhost:3003/upload
VITE_MEDIA_API_BASE_URL=http://localhost:4003/api/v1
```

### Identity (unchanged)

Identity does not require Media env in 1.1.0 unless implementing avatar upload consumer flow.

---

## Consumer implementation checklist

When adding Media support to a microservice:

- [ ] Add `@webonone/media-embed` dependency to consumer frontend.
- [ ] Add `VITE_MEDIA_*` env vars to `frontend/.env.example`.
- [ ] Implement `MediaPickerFrame` or modal using `buildMediaEmbedUrl()`.
- [ ] Implement `useMediaEmbedMessage()` listener with origin check.
- [ ] Send `webonone:media:init` with JWT after iframe load.
- [ ] Define scope naming convention for this service's resources.
- [ ] Validate user access to scope before opening picker.
- [ ] Store `media_id` + `url` in own DB — never blob bytes.
- [ ] Handle `single` and `multiple` mode in form binding.
- [ ] Call `DELETE /media/:id` when user removes media.
- [ ] Do not duplicate upload UI — embed Media routes.

---

## Acceptance criteria

1. WebOnOne opens Media picker iframe with scope path; no local upload form.
2. Single-select mode returns one item on Confirm; multiple returns array.
3. Upload-only embed posts `webonone:media:uploaded` without Confirm step.
4. Delete via REST removes file; consumer clears local reference.
5. Public `url` in responses loads image in consumer `<img>` tag.
6. All postMessage and JWT rules pass security checklist above.
7. Media and consumer each run standalone; integration degrades gracefully when peer is down.
