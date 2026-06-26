# WebOnOne Platform — Specification (1.5.0)

Extends [1.4.0](../1.4.0/README.md) with an **Identity profile page** that supports **view** and **edit** modes (default view), **Media selector embed** for profile images at `/root/users/{userId}` with **locked 1:1 crop**, and removal of the **WebOnOne media demo** route and navigation link.

Implementation branch: **`spec/1.5.0`**

**Spec No:** 1.5.0

## What changed from 1.4.0

| Area | 1.4.0 | 1.5.0 |
|------|-------|-------|
| Identity `/profile` | Always-editable form | **View mode** (default) + **Edit mode** toggle |
| Profile image | Static `Avatar` in form header | Larger image in view; edit overlay + Media **selector** embed in edit mode |
| Avatar storage | Google import URL only | User-selected image via Media; `avatarUrl` updated on save |
| WebOnOne nav | `Media demo` link + `/demo/media` page | **Removed** — profile image flow lives in Identity |

## Projects affected

| Project | Role in 1.5.0 |
|---------|----------------|
| **Identity** (`identity/`) | Profile view/edit UX; Media consumer (`@webonone/media-embed`); `mediaConfig.ts`; env for Media origin |
| **Media** (`media/`) | Selector embed supports locked crop aspect presets via query param (consumer passes `1:1` only) |
| **`@webonone/media-embed`** (`packages/media-embed/`) | Optional `cropAspectPresets` on selector URL builder |
| **WebOnOne v2** (`webonone-v2/`) | Remove media demo route, page, and nav item |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Goals, scope, glossary, success criteria |
| [02-identity-profile-page.md](./02-identity-profile-page.md) | View/edit modes, avatar selector, crop rules |
| [03-webonone-cleanup.md](./03-webonone-cleanup.md) | Remove media demo from core product |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| Subtask | ID | Spec doc / phase |
|---------|-----|------------------|
| [User Story] Spec No 1.5.0 improve the profile page | 86ey2n76k | All docs |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.4.0/02-media-iframe-components.md](../1.4.0/02-media-iframe-components.md) | Selector iframe, `ImageCropDialog`, `selectorUpload` |
| [../1.4.0/08-media-consumer-integration.md](../1.4.0/08-media-consumer-integration.md) | JWT init, postMessage, scope/folderPath |
| [../1.0.0/03-identity-project.md](../1.0.0/03-identity-project.md) | Identity service baseline |
| [../1.0.0/07-identity-webonone-integration.md](../1.0.0/07-identity-webonone-integration.md) | Profile return URL, auth code handoff |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` |
| Cross-service embed | iframe + postMessage; JWT via init message only |
| Frontend env | `VITE_MEDIA_ORIGIN` + derived paths in `mediaConfig.ts` |

## Local dev

```bash
npm run dev:identity   # Identity FE :3001, BE :4001
npm run dev:media      # Media FE :3003 (selector embed)
npm run build:media-embed
```
