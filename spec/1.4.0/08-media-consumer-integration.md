# 08 — Media Consumer Integration (1.4.0 delta)

Extends [../1.1.0/08-media-consumer-integration.md](../1.1.0/08-media-consumer-integration.md). Read the 1.1.0 doc first for JWT, security checklist, and REST patterns. This document covers **only what 1.4.0 adds**.

---

## New embed surfaces

| Surface | Route | Primary message(s) |
|---------|-------|-------------------|
| Upload dialog | `/upload-dialog` | `uploaded`, `cancel` |
| File selector | `/selector` | `select`, `cancel` |
| Media viewer | `/viewer` | `viewer-changed`, `cancel` |
| Full dialog | `/dialog` | `select` (if selectable), `uploaded`, `cancel` |

All surfaces use the same **init handoff**:

```typescript
iframe.addEventListener('load', () => {
  sendMediaInit(iframe, mediaOrigin, accessToken)
})
```

---

## When to use which surface

| User action in consumer | Surface | Why |
|-------------------------|---------|-----|
| "Upload a PDF" form field | `/upload-dialog` | `mediaType=pdf`, no browse UI |
| "Upload hero image" with crop | `/upload-dialog` | `mediaType=image&crop=true&defaultCropAspect=16:9` |
| "Choose existing file" | `/selector` | Minimal UI; immediate selection |
| Show site logo with "change" | `/viewer` | `mode=edit`; edit opens selector |
| "Open media library" for site | `/dialog` | Full toolbar + navigation |
| Legacy gallery picker | `/picker` | Unchanged 1.1.0 behavior |

---

## Example — upload with crop (WebOnOne)

```typescript
import { buildMediaUploadDialogUrl, sendMediaInit, useMediaEmbedMessage } from '@webonone/media-embed'
import { getMediaUploadDialogUrl } from '@/features/media/utils/mediaConfig'

const src = buildMediaUploadDialogUrl({
  baseUrl: getMediaUploadDialogUrl(),
  parentOrigin: window.location.origin,
  scope: `webonone:site:${siteId}/hero`,
  folderPath: '/',
  mediaType: 'image',
  crop: true,
  defaultCropAspect: '16:9',
})

useMediaEmbedMessage({
  mediaOrigin: getMediaOrigin(),
  onUploaded: (items) => setHeroImage(items[0]),
  onCancel: () => closeModal(),
})
```

---

## Example — file selector

```typescript
import { buildMediaSelectorUrl } from '@webonone/media-embed'
import { getMediaSelectorUrl } from '@/features/media/utils/mediaConfig'

const src = buildMediaSelectorUrl({
  baseUrl: getMediaSelectorUrl(),
  parentOrigin: window.location.origin,
  scope: `webonone:site:${siteId}/assets`,
  folderPath: `/user/${userId}`,
  mode: 'single',
  accept: 'image/*',
})
```

On `webonone:media:select`, parent receives `items[0].url` and `items[0].id` for DB storage.

---

## Example — viewer edit mode

```typescript
import { buildMediaViewerUrl } from '@webonone/media-embed'

const src = buildMediaViewerUrl({
  baseUrl: getMediaViewerUrl(),
  parentOrigin: window.location.origin,
  scope: `webonone:site:${siteId}/hero`,
  fileUrl: currentHeroUrl,
  mode: 'edit',
})

useMediaEmbedMessage({
  mediaOrigin: getMediaOrigin(),
  onViewerChanged: (item) => updateHeroRef(item),
})
```

---

## Example — full media dialog

```typescript
import { buildMediaDialogUrl } from '@webonone/media-embed'

const src = buildMediaDialogUrl({
  baseUrl: getMediaDialogUrl(),
  parentOrigin: window.location.origin,
  scope: `webonone:site:${siteId}`,
  folderPath: '/gallery',
  selectable: true,
  mode: 'multiple',
})
```

---

## Security checklist additions

| # | Requirement | Owner |
|---|-------------|-------|
| 11 | `crop` only honored for image MIME selection | Media FE |
| 12 | Scoped navigation cannot list parent of `folderPath` | Media FE |
| 13 | `viewer-changed` only sent to validated `parentOrigin` | Media FE |
| 14 | Consumer validates user access to `folderPath` before open | Consumer FE/BE |

All 1.1.0 checklist items (1–10) still apply.

---

## Consumer implementation checklist (1.4.0)

- [ ] Extend `mediaConfig.ts` with derived URLs for four new routes.
- [ ] Add `@webonone/media-embed` builders/hooks for surfaces in use.
- [ ] Handle `webonone:media:viewer-changed` in embed message listener.
- [ ] Do not add per-route `VITE_*` URL env vars.
- [ ] Store `media_id` + `url` in consumer DB on select/upload/viewer-changed.
- [ ] Validate scope + folder path before opening embed.

---

## Acceptance criteria (integration)

1. WebOnOne (or reference consumer) opens at least **selector** and **viewer** embeds end-to-end.
2. Upload dialog with `crop=true` returns cropped image URL in `uploaded` message.
3. Selector at `/user/{id}` cannot navigate to `/` when opened with that scoped root.
4. Full dialog creates folder and uploads file within scoped path; posts `select` when `selectable=true`.
5. All new message types pass origin validation on both sides.
