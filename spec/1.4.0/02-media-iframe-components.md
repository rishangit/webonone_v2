# 02 — Media Iframe Components

Four embeddable surfaces owned by **Media frontend**. Each route shares:

- **`EmbedLayout`** — minimal chrome, no standalone app nav when `parentOrigin` is set.
- **`useEmbedMode()`** — reads `parentOrigin`, `scope`, `folderPath`, and surface-specific params from query string.
- **`useMediaAuth()`** — JWT from `webonone:media:init` (never from URL).
- **`useMediaPostMessage()`** — posts results to validated `parentOrigin` only.

Reference baseline: [../1.1.0/03-media-project.md](../1.1.0/03-media-project.md).

---

## 1. File Upload iframe

**Route:** `GET /upload-dialog`  
**Replaces or complements:** `/upload` for flows that need crop and explicit media-type presets.

### Trigger (consumer)

Consumer opens iframe (modal or inline) when user clicks "Upload file" in the host app.

### Behavior

| Requirement | Detail |
|-------------|--------|
| Device upload | Native file input + drag-and-drop; works on desktop and mobile browsers |
| Media type filter | Query `mediaType`: `image` \| `pdf` \| `all` (maps to `accept` MIME list) |
| Optional MIME override | `accept` query still supported for fine-grained control |
| Single vs batch | `maxFiles` query (default `1` for upload-dialog; increase for batch) |
| Auto-close | On success, post `webonone:media:uploaded` and optionally close embed (consumer decides via `autoClose=true`) |
| Cancel | User dismisses → `webonone:media:cancel` |

### Media type presets

| `mediaType` | Effective `accept` |
|-------------|-------------------|
| `image` | `image/*` |
| `pdf` | `application/pdf` |
| `all` | `*/*` (subject to `maxSizeBytes` and backend validation) |

### Crop flow

When `crop=true` (only valid with `mediaType=image` or `accept` containing images):

1. User selects image file.
2. **`ImageCropDialog`** opens (see below).
3. User adjusts crop area and aspect ratio, then confirms.
4. Cropped blob uploaded via existing `POST /api/v1/media/upload`.
5. Parent receives `webonone:media:uploaded` with final `MediaItemDto`.

Crop dimensions are included in upload metadata (`width`, `height`) when available.

### ImageCropDialog

**Path:** `media/frontend/src/features/media/components/ImageCropDialog.tsx`

Shared crop dialog used by upload-dialog and selector upload flows.

#### A. Shell — `CustomDialog`

| Property | Value |
|----------|-------|
| Title | `Crop Image` |
| `sizeWidth` | `medium` (~66% viewport width) — **same as selector parent dialog** |
| `sizeHeight` | `large` (~75% viewport height) |
| `disableContentScroll` | `true` — no body scrollbar |
| Icon | Lucide `Crop` (`w-5 h-5`) |
| Footer | **Cancel** (outline) + **Crop & Upload** (primary) |

`CustomDialog` provides fixed full-screen overlay (`bg-black/50 backdrop-blur-sm`), centered panel with header, non-scrolling flex body, and footer.

#### B. Crop UI — `react-easy-crop`

| Requirement | Detail |
|-------------|--------|
| Container | `flex-1` crop area filling remaining dialog height (not fixed 400px) |
| `<Cropper>` | `image` from file data URL; controlled `crop`, `zoom`, `aspect` state |
| Interaction | Drag to reposition crop window |
| Zoom | UI Kit `Slider`, range **1×–3×** |
| Crop border | Accent / primary theme color on crop rectangle (`cropAreaStyle`) |
| Aspect presets | Optional `aspectPresets` prop; `RadioGroup` + `RadioGroupItem` per preset (`1:1`, `1:2`, `2:1`, `3:2`, `4:3`, `16:9`, `free`) — not button group |

On confirm, export cropped region to `File` blob (JPEG 0.92) and invoke `onConfirm`.

#### Consumers

| Surface | Default aspect | Trigger |
|---------|----------------|---------|
| `/upload-dialog` | `defaultCropAspect` query or `free` | `crop=true` + image file selected |
| `/selector` (upload area) | `1:1` | Image file selected in selector upload zone |

### UI notes

- Use `UploadDropzone` from existing Media components where possible.
- Lazy-load crop dialog / `react-easy-crop` where bundle size matters.
- Show upload progress and error states inline; errors do not postMessage until user retries or cancels.

---

## 2. File Selector iframe

**Route:** `GET /selector`

Lightweight picker — browse and pick one file (or multiple when `mode=multiple`) without full picker chrome.

### Trigger (consumer)

Consumer opens when user needs to choose an existing file from Media storage (e.g. "Change image" in a form field).

### Behavior

| Requirement | Detail |
|-------------|--------|
| Initial path | `folderPath` query opens at that path within `scope` (e.g. `/`, `/root/user/{id}`) |
| Scoped navigation | User may navigate into subfolders via double-click; **cannot** navigate above the initial `folderPath` (breadcrumb root locked) |
| Listing order | Folders first, then files (same as full dialog) |
| Selection | Single click selects row; double-click on folder navigates; double-click on file selects and confirms |
| Confirm button | Shown for `mode=multiple`; hidden for default single-select (immediate post on file pick) |
| Callback | Posts `webonone:media:select` with `items` array containing `id`, `url`, `fileName`, `mimeType`, `folderPath` |

### Toolbar and views (`ScopedFolderBrowser` in selector mode)

| Requirement | Detail |
|-------------|--------|
| Chrome | No “File selector” title (`chromeless`); single **header bar** — breadcrumb **left**, icon toolbar **right** |
| Header toolbar | **New folder** (`FolderPlus`); **List** / **Grid** toggle; **Upload** (`Upload` icon) opens file input — same flow as prior drop zone (image → crop when enabled) |
| Drop zone | **No separate drop strip.** List/thumb container is the drop target; subtle hint (“Drag files here or use Upload”) when folder is empty |
| List view | `ItemList` glass rows per [item-list skill](../../../.cursor/skills/item-list/SKILL.md): name, size, modified date; **folders and files** each have `ItemListMenu` |
| Folder menu | Open (navigate), Delete empty folder (`DELETE /api/v1/folders/:id`) |
| File menu | View image (images only), Delete file |
| Thumb view | Responsive grid (`grid-cols-3` … `xl:grid-cols-6`); compact 1:1 thumbs; name, size, date below; 3-dot menu on folders and files |
| Scroll | File/folder area scrolls when content overflows (`overflow-auto`, themed scrollbar) |
| View image | Large `CustomDialog` with full image preview (non-destructive) |
| Folders | `Folder` icon; single-click navigates; breadcrumb in header updates via `useScopedNavigation` |
| Delete | `MediaDeleteDialog` for files; folder delete when empty; refresh list after |

### Return value to consumer

Parent handler receives the **file path** (virtual `folderPath` + file name) and public **`url`** in `MediaItemDto`. Consumer stores `media_id` + `url` in its own DB per 1.1.0 — never blob bytes.

---

## 3. Media Viewer iframe

**Route:** `GET /viewer`

Inline preview of a media item with optional edit affordance.

### Query inputs

| Param | Required | Description |
|-------|----------|-------------|
| `fileUrl` | Yes* | Public Media file URL to display |
| `mediaId` | Alt | If `fileUrl` omitted, resolve via Media API by id within `scope` |
| `mode` | No | `view` (default) or `edit` |
| `parentOrigin`, `scope` | Yes in embed | Standard embed params |

### View mode

- **Images:** render `<img>` with max dimensions fit inside embed; respect theme background.
- **Non-images (PDF, etc.):** show file-type icon + file name from URL or API metadata.
- No edit overlay.

### Edit mode

- Same preview as view mode.
- **Edit icon** overlay (pencil) on image or file icon.
- Click edit → open **file selector** (inline overlay iframe or navigate to `/selector` with `parentOrigin` preserved and `returnTo=viewer`).
- On new selection, viewer updates display and posts:

```json
{
  "type": "webonone:media:viewer-changed",
  "scope": "webonone:site:abc123/gallery",
  "item": { "id": "...", "url": "...", "fileName": "...", "mimeType": "...", "sizeBytes": 0 }
}
```

Parent updates form state / DB reference from this message.

---

## 4. Full Media Dialog iframe

**Route:** `GET /dialog`

Full library experience for consumers that need browse + manage within a scoped subtree (similar to standalone `LibraryPage` but embeddable).

### Trigger (consumer)

Consumer opens modal with iframe when user clicks "Media library" or equivalent.

### Embed entry

| Query param | Purpose |
|-------------|---------|
| `folderPath` | Root of navigable tree (scoped root) |
| `scope` | Storage scope |
| `parentOrigin` | Embed mode + postMessage target |

### Toolbar and navigation

| Toolbar action | Behavior |
|----------------|----------|
| **Create new folder** | Prompt for name → `POST /api/v1/folders` under current path |
| **Upload files** | Opens upload sub-flow (inline dropzone or nested `/upload-dialog` with `folderPath` = current path) |

| Navigation rule | Detail |
|-----------------|--------|
| Folder list | `ItemList` rows; folders listed before files |
| Enter folder | Double-click folder row |
| Breadcrumb | Shows path from scoped root to current; clicking ancestor within scoped root navigates |
| Boundary | User **cannot** navigate above the `folderPath` passed at open time |

### Selection (optional)

When opened with `selectable=true`:

- User selects file(s) and clicks **Confirm** → `webonone:media:select`.
- Without `selectable`, dialog is manage-only (upload/create folder); close posts `webonone:media:cancel` or silent close per `onClose` query.

### Relationship to `/picker`

| Surface | Use when |
|---------|----------|
| `/picker` | Legacy combined browse + upload + confirm (1.1.0) — keep for backward compatibility |
| `/dialog` | Full manager with toolbar; scoped root; optional selection |
| `/selector` | Lightweight pick-only; minimal UI |

---

## Shared security (all surfaces)

| Rule | Enforcement |
|------|-------------|
| JWT not in URL | Token only via `webonone:media:init` |
| `parentOrigin` allowlist | Media FE validates against `VITE_ALLOWED_PARENT_ORIGINS` |
| postMessage target | Specific `parentOrigin` — never `'*'` |
| `frame-ancestors` CSP | Media FE response headers |
| Scope ownership | Consumer validates before opening embed; Media API validates JWT + scope format |

---

## File layout (Media frontend)

```text
media/frontend/src/features/media/
  pages/
    UploadDialogPage.tsx      # /upload-dialog
    SelectorPage.tsx          # /selector
    ViewerPage.tsx            # /viewer
    FullDialogPage.tsx        # /dialog
  components/
    ImageCropDialog.tsx       # crop UI + aspect toolbar
    MediaViewer.tsx           # view/edit preview
    ScopedFolderBrowser.tsx   # shared list + breadcrumb for selector & dialog
    CreateFolderDialog.tsx    # small folder name prompt
    MediaPreviewDialog.tsx    # large image preview from selector menu
    EmbedToolbar.tsx          # new folder + upload actions
  hooks/
    useScopedNavigation.ts    # enforce folderPath root boundary
```
