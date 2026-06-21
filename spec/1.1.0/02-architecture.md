# 02 — Architecture (1.1.0)

Extends [1.0.0 architecture](../1.0.0/02-architecture.md) with the Media service. All [1.0.0 design principles](../1.0.0/02-architecture.md#design-principles) still apply.

## Topology

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  identity/                         (standalone — unchanged)               │
│  identity-fe :3001    identity-be :4001    identity_db                   │
│  Issues JWT; Media verifies locally                                       │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  media/                            (standalone — NEW)                     │
│  media-fe :3003       media-be :4003       webonone_media + blob store   │
│  Routes: /upload, /picker (embed via parentOrigin + scope query)          │
│  Serves public file URLs from media.webonone.com                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  webonone-v2/                      (standalone — consumes Media)          │
│  webonone-fe :3000    webonone-be :4000    webonone_db                   │
│  Stores mediaId + url references only — never blob bytes                  │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  ui-kit/                           (standalone)                             │
│  showcase :3002    @webonone/ui-kit    ← consumed by all FEs              │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  packages/                                                                │
│  @webonone/platform-nav   — auth redirect (existing)                      │
│  @webonone/media-embed    — Media iframe + postMessage (NEW)              │
└──────────────────────────────────────────────────────────────────────────┘
```

## Design principles (Media-specific)

| Principle | Application |
|-----------|-------------|
| One DB per service | `webonone_media` only; consumers store `media_id` copies, not files |
| Media owns all blobs | Files live in Media storage; consumers hold URLs + foreign IDs |
| Auth UI owned by Identity | Media never implements login — redirects or auth-code handoff |
| Upload UI owned by Media | Consumers never duplicate upload/picker UI — embed iframe |
| JWT across services | Identity issues; Media backend verifies signature + `iss` + `aud` + `exp` |
| Scope isolation | Each consumer passes `scope`; paths cannot escape scope prefix |

## Connection layers (Media ↔ consumers)

Same layered model as [Identity ↔ WebOnOne](../1.0.0/07-identity-webonone-integration.md#three-connection-layers):

| Layer | Channel | Used for |
|-------|---------|----------|
| **1 — UI embed** | `<iframe>` + query params | Host Media picker/upload at consumer route |
| **2 — Browser handoff** | `window.postMessage` + origin checks | Return selected/uploaded media DTOs to parent |
| **3 — API auth** | `Authorization: Bearer <JWT>` | Direct upload/list/delete from consumer FE or BE |
| **4 — Async sync** | Versioned events (optional) | `MediaDeleted` → consumer removes local reference |

**Never:** shared blob storage paths, cross-service SQL, JWT in URL query/hash, or Media BE calling Identity BE per request.

```text
Standalone:   Media runs alone (own FE + BE + DB + blob store)
UI connect:   Consumer FE ←iframe/postMessage→ Media FE
API auth:     Consumer FE ──Bearer JWT──► Media BE (verify locally)
Backend sync: Media BE ──MediaDeleted event──► Consumer BE (future, optional)
```

## Iframe media picker flow

```text
1. User in WebOnOne editor clicks "Choose image"
2. WebOnOne opens modal with <MediaPickerFrame /> iframe src:
     http://localhost:3003/picker
       ?parentOrigin=http://localhost:3000
       &scope=webonone:site:abc123/gallery
       &mode=multiple
       &accept=image/*
3. Media PickerPage detects parentOrigin → embed mode (minimal chrome)
4. User uploads files and/or selects existing items in scope folder tree
5. User clicks Confirm
6. PickerPage posts message to parent:
     { type: 'webonone:media:select', items: [{ id, url, fileName, mimeType, sizeBytes }, ...] }
7. WebOnOne parent validates event.origin === MEDIA_ORIGIN
8. WebOnOne stores mediaId + url in local state / saves to webonone_db reference table
9. Modal closes
```

### Upload-only embed (no selection)

Route **`/upload`** — same embed contract; on successful upload(s), posts `webonone:media:uploaded` instead of waiting for Confirm.

## JWT between projects

- Identity backend signs JWT (`sub`, `email`, `iss: webonone-identity`, `aud: webonone-api`).
- Media backend verifies with shared `JWT_SECRET` (dev) or public key (prod) — **same contract as WebOnOne**.
- Media frontend obtains JWT from:
  - **Auth-code handoff** via `@webonone/platform-nav` when opening standalone Media UI from another service, or
  - **postMessage** from parent (parent passes token in iframe init message — see [08-media-consumer-integration.md](./08-media-consumer-integration.md)), or
  - User navigates to Media standalone after Identity login redirect.

Media API attaches and verifies Bearer token on every mutating request.

## Public file URLs

Files are served by Media BE (dev) or CDN in front of blob store (prod):

```text
https://media.webonone.com/files/{mediaId}/{fileName}
```

- `mediaId` — nanoid `CHAR(21)` primary key.
- `fileName` — URL-safe slug for SEO/cache-friendly links; lookup is by `mediaId`.
- Private scopes (future): signed URL with expiry; 1.1.0 uses public URLs for all scopes in dev.

## Repo layout (1.1.0)

```text
PROJECTS/2026/
├── spec/
│   ├── 1.0.0/                  # unchanged baseline
│   └── 1.1.0/                  # Media extension (this folder)
├── identity/
├── webonone-v2/
├── media/                      # NEW
│   ├── frontend/
│   ├── backend/
│   └── package.json
├── ui-kit/
├── packages/
│   ├── platform-nav/
│   └── media-embed/            # NEW — iframe + postMessage contract
└── .cursor/rules/
```

## Running locally

| Project | Command | URLs |
|---------|---------|------|
| Media | `cd media && npm run dev` | FE `:3003`, BE `:4003` |
| Full stack | `npm run dev` (root) | All services including Media |

Media embed in WebOnOne requires **Media FE running** and user **authenticated** (JWT available to iframe).

**Integration guide:** [08-media-consumer-integration.md](./08-media-consumer-integration.md).
