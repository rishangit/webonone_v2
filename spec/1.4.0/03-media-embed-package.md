# 03 — `@webonone/media-embed` Package Extensions

Location: `packages/media-embed/`

Extends the 1.1.0 package so consumers do not duplicate iframe URL or postMessage logic for the four new surfaces.

Baseline exports: [../1.1.0/08-media-consumer-integration.md](../1.1.0/08-media-consumer-integration.md).

---

## New URL builders

| Function | Base path | Notes |
|----------|-----------|-------|
| `buildMediaUploadDialogUrl()` | `{origin}/upload-dialog` | `mediaType`, `crop`, `cropAspect`, `maxFiles` |
| `buildMediaSelectorUrl()` | `{origin}/selector` | `folderPath`, `mode`, `accept` |
| `buildMediaViewerUrl()` | `{origin}/viewer` | `fileUrl` or `mediaId`, `mode` |
| `buildMediaDialogUrl()` | `{origin}/dialog` | `folderPath`, `selectable` |

Existing `buildMediaEmbedUrl()` remains for `/picker` and `/upload`.

### Shared options (all builders)

Extends `BuildMediaEmbedUrlOptions` or dedicated option interfaces:

```typescript
export type MediaTypePreset = 'image' | 'pdf' | 'all'

export interface BuildMediaUploadDialogUrlOptions extends BuildMediaEmbedUrlOptions {
  mediaType?: MediaTypePreset
  crop?: boolean
  defaultCropAspect?: '1:1' | '1:2' | '2:1' | '3:2' | '4:3' | '16:9' | 'free'
  autoClose?: boolean
}

export interface BuildMediaSelectorUrlOptions extends BuildMediaEmbedUrlOptions {
  folderPath: string
  mode?: 'single' | 'multiple'
}

export interface BuildMediaViewerUrlOptions {
  baseUrl: string
  parentOrigin: string
  scope: string
  fileUrl?: string
  mediaId?: string
  mode?: 'view' | 'edit'
}

export interface BuildMediaDialogUrlOptions extends BuildMediaEmbedUrlOptions {
  folderPath: string
  selectable?: boolean
}
```

Derive base URLs in consumer `mediaConfig.ts` from `VITE_MEDIA_ORIGIN` only — no per-route env vars.

---

## New message types

Add to `MEDIA_MESSAGE_TYPES`:

| Constant | Direction | Purpose |
|----------|-----------|---------|
| `VIEWER_CHANGED` | Media → parent | `webonone:media:viewer-changed` — edit mode picked new file |

Existing types unchanged: `init`, `select`, `uploaded`, `deleted`, `cancel`, `confirm`, `selection-change`.

### `MediaViewerChangedMessage`

```typescript
export interface MediaViewerChangedMessage {
  type: typeof MEDIA_MESSAGE_TYPES.VIEWER_CHANGED
  scope: string
  item: MediaItemDto
}
```

Extend `MediaItemDto` optionally:

```typescript
folderPath?: string  // virtual path within scope
```

---

## React hooks

| Hook | Purpose |
|------|---------|
| `useMediaUploadDialogFrame()` | Modal state + iframe ref for upload-dialog |
| `useMediaSelectorFrame()` | Modal state for selector |
| `useMediaViewerFrame()` | Inline or modal viewer embed |
| `useMediaDialogFrame()` | Full dialog modal state |

Each hook pairs with extended `useMediaEmbedMessage()` handlers for the relevant message types.

### `useMediaEmbedMessage` extensions

```typescript
interface UseMediaEmbedMessageOptions {
  mediaOrigin: string
  onSelect?: (items: MediaItemDto[], scope: string) => void
  onUploaded?: (items: MediaItemDto[], scope: string) => void
  onViewerChanged?: (item: MediaItemDto, scope: string) => void
  onCancel?: () => void
  onDeleted?: (ids: string[], scope: string) => void
}
```

---

## Optional frame components

| Component | Wraps |
|-----------|--------|
| `MediaUploadDialogFrame` | upload-dialog iframe + init |
| `MediaSelectorFrame` | selector iframe |
| `MediaViewerFrame` | viewer iframe |
| `MediaDialogFrame` | full dialog iframe |

`MediaPickerFrame` remains for `/picker` backward compatibility.

---

## Consumer config pattern

```typescript
// webonone-v2/frontend/src/features/media/utils/mediaConfig.ts
export function getMediaOrigin(): string { ... }

export function getMediaUploadDialogUrl(): string {
  return `${getMediaOrigin()}/upload-dialog`
}
export function getMediaSelectorUrl(): string {
  return `${getMediaOrigin()}/selector`
}
export function getMediaViewerUrl(): string {
  return `${getMediaOrigin()}/viewer`
}
export function getMediaDialogUrl(): string {
  return `${getMediaOrigin()}/dialog`
}
```

---

## Build and workspace wiring

| Step | Location |
|------|----------|
| Export new APIs from `packages/media-embed/src/index.ts` | Package |
| `npm run build:media-embed` at root | Already exists |
| WebOnOne `build` chains `build:media-embed` | `webonone-v2/package.json` |
| Vite alias to `packages/media-embed/src` in dev | `webonone-v2/frontend/vite.config.ts` |

---

## Verification

```bash
npm run build -w @webonone/media-embed
npm run type-check -w media-root   # if media imports package in FE
```

Consumer must not import Media service source — only `@webonone/media-embed` and env-derived origins.
