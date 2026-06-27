# WebOnOne Platform — Specification (1.7.0)

Extends [1.5.0](../1.5.0/README.md) with a reusable **`ImagePreview`** composite in **UI Kit** — fixed `w-40 h-40` image display, **view** and **edit** modes, centered edit overlay, and consumer wiring to the **Media selector** embed dialog.

Implementation branch: **`spec/1.7.0`**

**Spec No:** 1.7.0

## Revision history

- **Subtask 86ey2yka6** — AlertDialog delete confirm in showcase; remove plain PhoneInput demo; stacked sibling dialogs (`stackLevel`); Media selector crop uses stacked pattern.
- **Subtask 86ey2ya9p** — Showcase demos for with/without image; empty state shows centered image icon; Identity profile view mode uses `ImagePreview` for UI alignment.

## What changed from 1.5.0

| Area | 1.5.0 | 1.7.0 |
|------|-------|-------|
| Profile avatar UI | Inline `Avatar` + custom overlay in Identity | Shared **`ImagePreview`** export from `@webonone/ui-kit` |
| Image edit pattern | Duplicated in `ProfileAvatarEditor` | Single component: fixed size, edit overlay, `onEdit` callback |
| Media picker | Identity-only `ProfileMediaSelectorModal` | Unchanged ownership in consumer; **ImagePreview** triggers `onEdit` → consumer opens Media selector |
| Showcase | No ImagePreview demo | Components tab demo with view/edit toggle |

## Projects affected

| Project | Role in 1.7.0 |
|---------|----------------|
| **UI Kit** (`ui-kit/`) | `ImagePreview`, dialog/phone showcase improvements |
| **Identity** (`identity/`) | Refactor profile avatar to `ImagePreview` |
| **Media** (`media/`) | Stacked crop dialog in selector embed |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Goals, scope, glossary, success criteria |
| [02-image-preview-component.md](./02-image-preview-component.md) | `ImagePreview` API, modes, theme, Media integration contract |
| [03-ui-kit-improvements.md](./03-ui-kit-improvements.md) | AlertDialog delete, PhoneInput showcase, stacked sibling dialogs, Media crop |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan (implementation) |

## ClickUp traceability

| Subtask | ID | Spec doc / phase |
|---------|-----|------------------|
| [User Story] Spec 1.7.0 | 86ey2y7vc | All docs |
| UI-kit showcase, show the image preview component | 86ey2ya9p | [02](./02-image-preview-component.md); Phase 2–3 |
| UI-kit improvement | 86ey2yka6 | [03](./03-ui-kit-improvements.md); Phase 4 |

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.5.0/02-identity-profile-page.md](../1.5.0/02-identity-profile-page.md) | Profile view/edit avatar pattern |
| [../1.4.0/08-media-consumer-integration.md](../1.4.0/08-media-consumer-integration.md) | Media selector iframe + postMessage |
| [../1.0.0/05-ui-kit-project.md](../1.0.0/05-ui-kit-project.md) | UI Kit package + showcase workflow |

## Rules reference

| Topic | Rule |
|-------|------|
| Service boundaries | `microservice-architecture.mdc` — UI Kit does not import Media service code; consumers embed Media via `@webonone/media-embed` |
| Code style | `code-cleanliness.mdc` — `@/` aliases in consumers |

## Local dev

```bash
npm run dev:ui-kit      # Showcase :3002
npm run dev:identity    # Profile page consumer :3001
npm run build -w @webonone/ui-kit
```
