# 07 — Implementation Plan

Phased delivery for **Media 1.4.0** iframe components on branch **`spec/1.4.0`**.

---

## Branch workflow

```bash
git checkout master
git pull origin master
git checkout -b spec/1.4.0
```

| Rule | Detail |
|------|--------|
| Base branch | `master` |
| Spec branch | `spec/1.4.0` |
| Implementation | Continue on `spec/1.4.0` or cut `feature/media-1.4.0-embeds` from spec branch per team preference |
| Scope | `media/`, `packages/media-embed/`, WebOnOne consumer reference |
| PR title (implementation) | `feat(media): 1.4.0 iframe upload, selector, viewer, dialog` |

Commit spec files first (this folder), then implement in phases below.

---

## Phase 0 — Spec and scaffold (1 day)

**Deliverables**

- [x] `spec/1.4.0/*` documentation
- [x] Branch `spec/1.4.0`
- [ ] Route stubs in `media/frontend/src/app/router.tsx`
- [ ] Empty page components for four routes with `EmbedLayout`

**Exit criteria:** `npm run dev:media` serves placeholder embed pages at new routes.

---

## Phase 1 — `@webonone/media-embed` contracts (2 days)

**Goal:** Types and URL builders before UI work.

| Task | Detail |
|------|--------|
| New message type | `VIEWER_CHANGED` |
| URL builders | `buildMediaUploadDialogUrl`, `buildMediaSelectorUrl`, `buildMediaViewerUrl`, `buildMediaDialogUrl` |
| Hook options | Extend `useMediaEmbedMessage` with `onViewerChanged` |
| Frame hooks | `useMediaUploadDialogFrame`, `useMediaSelectorFrame`, `useMediaViewerFrame`, `useMediaDialogFrame` |
| Export | Update `packages/media-embed/src/index.ts` |

**Exit criteria:** `npm run build -w @webonone/media-embed` passes; unit tests for URL query params (optional).

---

## Phase 2 — File Upload iframe (3–4 days)

| Task | Priority |
|------|----------|
| `UploadDialogPage` + `mediaType` preset mapping | P0 |
| Device file input + drag-and-drop (mobile-friendly) | P0 |
| Wire to `POST /api/v1/media/upload` | P0 |
| `ImageCropDialog` + aspect ratio toolbar | P1 |
| postMessage `uploaded` / `cancel` | P0 |

**Exit criteria:** Consumer test page uploads image with `crop=true`; parent receives `MediaItemDto`.

---

## Phase 3 — File Selector iframe (2–3 days)

| Task | Priority |
|------|----------|
| `SelectorPage` + `ScopedFolderBrowser` | P0 |
| `useScopedNavigation` — lock to initial `folderPath` | P0 |
| Folders-first `ItemList` | P0 |
| Single-select immediate `select` message | P0 |
| Multiple-select + Confirm | P1 |

**Exit criteria:** Open at `/user/{id}`; cannot navigate above scoped root; selection returns URL to parent.

---

## Phase 4 — Media Viewer iframe (2–3 days)

| Task | Priority |
|------|----------|
| `ViewerPage` + `MediaViewer` — view mode | P0 |
| Image vs file-icon rendering | P0 |
| Edit mode overlay + open selector | P1 |
| `viewer-changed` postMessage | P1 |

**Exit criteria:** Edit flow replaces preview and notifies parent with new item.

---

## Phase 5 — Full Media Dialog iframe (4–5 days)

| Task | Priority |
|------|----------|
| `FullDialogPage` + `EmbedToolbar` | P0 |
| Create folder + upload actions | P0 |
| Double-click folder navigation within scope | P0 |
| Optional `selectable` + Confirm | P1 |
| Reuse `ScopedFolderBrowser` from Phase 3 | P0 |

**Exit criteria:** Toolbar actions work; navigation bounded; selection mode posts `select`.

---

## Phase 6 — WebOnOne consumer reference (2 days)

| Task | Detail |
|------|--------|
| Extend `mediaConfig.ts` | Derived URLs for four routes |
| Site editor | Use viewer + selector for at least one field |
| Modal wiring | `MediaSelectorFrame` or custom modal |

**Exit criteria:** WebOnOne FE type-check passes; manual embed smoke test.

---

## Phase 7 — Verification and docs (1 day)

```bash
npm run build -w @webonone/media-embed
npm run build -w media-root
npm run type-check -w media-root
npm run lint -w media-root
```

Manual QA matrix:

| Surface | Check |
|---------|-------|
| Upload dialog | image, pdf, all; crop ratios; mobile file pick |
| Selector | scoped path; single + multiple |
| Viewer | view + edit |
| Full dialog | toolbar; navigation boundary; selectable |

---

## Risk and mitigations

| Risk | Mitigation |
|------|------------|
| Crop library bundle size | Use lightweight canvas cropper; lazy-load crop dialog |
| Scoped nav edge cases | Unit test `useScopedNavigation` path normalization |
| Overlap with `/picker` | Document surface selection table; keep `/picker` stable |
| Mobile iframe file input | Test iOS Safari + Android Chrome in Phase 2 |

---

## Estimated timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0 Spec/scaffold | 1 d | ~1 d |
| 1 media-embed | 2 d | ~3 d |
| 2 Upload | 3–4 d | ~7 d |
| 3 Selector | 2–3 d | ~10 d |
| 4 Viewer | 2–3 d | ~13 d |
| 5 Full dialog | 4–5 d | ~18 d |
| 6 Consumer | 2 d | ~20 d |
| 7 QA | 1 d | ~21 d |

**~4 weeks** one developer.

---

## Acceptance checklist (release)

### Media frontend

- [ ] Routes: `/upload-dialog`, `/selector`, `/viewer`, `/dialog`
- [ ] All embed pages use `EmbedLayout` when `parentOrigin` set
- [ ] Crop dialog with aspect ratio toolbar for image upload
- [ ] Scoped navigation cannot escape initial `folderPath`
- [ ] postMessage contracts per [08-media-consumer-integration.md](./08-media-consumer-integration.md)

### `@webonone/media-embed`

- [ ] All new builders and types exported
- [ ] `npm run build -w @webonone/media-embed` from clean `dist/`
- [ ] WebOnOne build chains `build:media-embed`

### Security

- [ ] JWT only via init message
- [ ] Origin checks on parent and iframe
- [ ] No `postMessage('*')`

### Regression

- [ ] `/picker` and `/upload` unchanged for existing consumers
- [ ] Media standalone `npm run dev:media` works without WebOnOne
- [ ] `npm run dev` from repo root starts all services

---

## Phase 8 — WebOnOne profile image demo (2 days)

| Task | Detail |
|------|--------|
| 200×200 viewer embed with user profile image | `MediaDemoPage`, `MediaViewerEmbed` |
| Double-click view/edit toggle; selector at `/root/users/{userId}` | WebOnOne consumer |
| Device upload from demo page | `MediaUploadDialogModal` |

**Exit criteria:** First section on `/demo/media` works end-to-end.

---

## Phase 9 — Library embed demos (1 day)

| Task | Detail |
|------|--------|
| `LibraryEmbedDemos` on library page | viewer, upload, selector buttons |
| Preview last selection | 200×200 thumbnail |

**Exit criteria:** `LibraryPage` demonstrates all three surfaces.

---

## Phase 10 — Media app shell + component showcase (2–3 days)

| Task | Detail |
|------|--------|
| `AppShell` + left nav + header avatar (`avatarUrl`) | `AppLayout`, nav config |
| `/components` showcase page | view/edit toggle, centered edit icon, profile-folder selector |
| Selector upload + 1:1 crop in selector embed | `SelectorPage` |
| `ensureFolderPath` for `/root/users/{id}/profile` | `mediaApi.ts` |
| Upload + selector sections at `/root` | `ComponentShowcasePage` |

**Exit criteria:** Logged-in Media app shows avatar in header; Components page meets [09-media-component-showcase.md](./09-media-component-showcase.md).

---

## ClickUp subtask traceability

| Subtask | ID | Phase |
|---------|-----|-------|
| [User Story] Spec 1.4.0 Media need to support the microservice | 86ey244jy | Phases 0–7 |
| in weboneone media demo, first item | 86ey2a7wx | Phase 8 |
| media project user should be able to show the each component | 86ey2aab9 | Phase 9 |
| Media project header need to thave the google account image | 86ey2avdh | Phase 10 |
| image crop implemntation | 86ey2dwgh | Phase 11 |
| crop image window need to be the same size as the select image dialog window | 86ey2e5bb | Phase 12 |

---

## Phase 12 — Crop dialog sizing + selector UX polish (1–2 days)

| Task | Detail |
|------|--------|
| Crop dialog size | `ImageCropDialog` uses `CustomDialog` `sizeWidth="medium"`, `sizeHeight="large"`, `disableContentScroll` — same footprint as selector embed parent dialog; no body scrollbar |
| Aspect presets | `RadioGroup` + `RadioGroupItem` (not button group) for ratio selection |
| Selector toolbar | Icon toolbar in file area (no “File selector” heading); **New folder** opens small name dialog → `POST /api/v1/folders` |
| List view | `ItemList` rows: name, size, modified date; `ItemListMenu` with View + Delete |
| Thumb view | 1:1 thumb cards, max 4 per row; name, size, modified date below; same 3-dot menu |
| Image preview | Large `CustomDialog` when View selected from menu |
| Folders | Folder icon; single-click navigates; breadcrumb updates (existing `useScopedNavigation`) |
| API | Expose `updatedAt` on `MediaItemDto` for modified date display |

**Exit criteria:** Crop dialog matches selector dialog size without scroll; selector toolbar + list/thumb toggle work in embed and `/components` showcase.

---

## Phase 11 — ImageCropDialog (`react-easy-crop`) (1–2 days)

| Task | Detail |
|------|--------|
| `ImageCropDialog` shell | `CustomDialog` — title "Crop Image", `sizeWidth="small"`, `sizeHeight="large"`, footer Cancel + Crop & Upload |
| Crop UI | `react-easy-crop` `<Cropper>` in 400px-tall container; drag reposition; zoom slider 1×–3× |
| Aspect presets | Button toolbar: `1:1`, `1:2`, `2:1`, `3:2`, `4:3`, `16:9`, `free` |
| Accent crop border | Primary theme color on crop rectangle |
| Consumers | `UploadDialogPage`, `SelectorPage` (1:1 default in selector upload flow) |

**Exit criteria:** Crop dialog matches [02-media-iframe-components.md#imagecropdialog](./02-media-iframe-components.md#imagecropdialog); upload and selector flows produce cropped blob before upload.
