# WebOnOne Platform — Specification (1.4.0)

Extends [1.3.0](../1.3.0/README.md) with **four embeddable Media iframe surfaces** — file upload, file selector, media viewer, and full media dialog — so consumer microservices can integrate Media UI without duplicating upload, browse, crop, or preview logic.

Implementation branch: **`spec/1.4.0`**

## What changed from 1.3.0

| Area | 1.3.0 | 1.4.0 |
|------|-------|-------|
| Media embed routes | `/picker`, `/upload` (browse + select, upload-only) | + **`/upload-dialog`**, **`/selector`**, **`/viewer`**, **`/dialog`** |
| Upload embed | Drag-and-drop batch; MIME via `accept` query | + **media-type presets** (`image`, `pdf`, `all`); optional **image crop** with aspect-ratio toolbar |
| Selection embed | Full picker with Confirm | + **lightweight selector** — scoped folder path, immediate callback on pick |
| Viewer | None | **`/viewer`** — view or edit mode; edit opens selector |
| Full library UI | Standalone `LibraryPage` only | **`/dialog`** — embeddable full browser with toolbar (new folder, upload) and scoped navigation |
| `@webonone/media-embed` | Picker + upload URL builders, `MediaPickerFrame` | + URL builders, hooks, and message types for all four surfaces |

## Projects affected

| Project | Role in 1.4.0 |
|---------|----------------|
| **Media** (`media/`) | New embed routes and pages; crop UI; viewer and full-dialog components |
| **`@webonone/media-embed`** (`packages/media-embed/`) | Typed contracts, URL builders, React hooks for upload, selector, viewer, full dialog |
| **WebOnOne v2** | Adopt viewer + selector where site editor needs inline preview/edit |
| **UI Kit** (`ui-kit/`) | Crop toolbar, dialog chrome, `ItemList` for folder/file rows (no new primitives required beyond existing 1.3.0) |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Goals, scope, glossary, success criteria |
| [02-media-iframe-components.md](./02-media-iframe-components.md) | Upload, selector, viewer, full dialog — behavior and UI |
| [03-media-embed-package.md](./03-media-embed-package.md) | `@webonone/media-embed` API extensions |
| [04-media-routes-and-api.md](./04-media-routes-and-api.md) | Routes, query params, REST touchpoints |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan (phases, paths, verification) |
| [08-media-consumer-integration.md](./08-media-consumer-integration.md) | Consumer integration delta from 1.1.0 |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.1.0/03-media-project.md](../1.1.0/03-media-project.md) | Media service baseline (API, DB, storage, `/picker`, `/upload`) |
| [../1.1.0/08-media-consumer-integration.md](../1.1.0/08-media-consumer-integration.md) | Iframe + postMessage + JWT patterns (extended in 1.4.0 doc 08) |
| [../1.3.0/05-dialogs.md](../1.3.0/05-dialogs.md) | `CustomDialog` for crop and full-dialog chrome |
| [../1.3.0/04-composite-components.md](../1.3.0/04-composite-components.md) | `ItemList` for folder/file rows |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| Cross-service embed | iframe + postMessage; JWT via init message only |
| MySQL / nanoid | `mysql-database-architecture.mdc` |
| Express + JWT | `nodejs-express.mdc` |

## Local dev

```bash
npm run dev:media          # Media FE :3003, BE :4003
npm run build:media-embed  # required before consumer prod build
npm run dev:webonone       # consumer integration testing
```
