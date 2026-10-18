---
name: ui-consistency
description: >-
  Mandatory pre-implementation UI check. Before adding or changing pages,
  dialogs, lists, forms, or controls, search the app and @webonone/ui-kit (or
  @webonone/mobile-ui) for a similar implementation, reuse it, and extract
  duplicated markup into a shared component. Use for every user-visible feature
  in any frontend or the Expo app. Run before writing UI.
---

# UI consistency

**Subagent:** [.cursor/agents/ui-consistency-agent.md](../../agents/ui-consistency-agent.md)

Run this **before** implementing a user-visible feature. The new screen must match an existing one and must not copy markup that already lives in a component or in the UI kit.

## When

Any task that adds or changes pages, dialogs, lists, forms, controls, empty states, or layout in `*/frontend`, `ui-kit/`, `mobile/`, or `packages/mobile-ui/`.

Skip for backend-only work, migrations, and copy or translation edits that do not change layout or components.

## Order

1. Launch **ui-consistency-agent** (or, if you are that agent, do the search yourself — do not spawn a second copy).
2. Wait for the reuse report.
3. If the report says **extract**, pull the existing markup into the named component and switch current call sites **before** adding the new feature.
4. Implement the feature with that component and `@webonone/ui-kit` (web) or `@webonone/mobile-ui` (mobile).

Do not start feature UI until the report is in hand.

## Search

Stay inside the app you are changing, then the kit.

| Look in | What to open |
|---------|----------------|
| This frontend | `features/**/components`, `shared/components`, pages and dialogs with the same job (list, details, picker, wizard, empty state) |
| Web kit | `ui-kit/package/src/index.ts` and the component file |
| Mobile | `packages/mobile-ui` exports, then `mobile/src` screens |
| Rules | [ui-kit-consumption.mdc](../../rules/ui-kit-consumption.mdc), [front-end-structure.mdc](../../rules/front-end-structure.mdc), and the layout skill that matches the screen ([feature-page-layout.mdc](../../rules/feature-page-layout.mdc), [item-list](../item-list/SKILL.md), [dialog-windows.mdc](../../rules/dialog-windows.mdc), [form-creation](../form-creation/SKILL.md), [details-page-cards](../details-page-cards/SKILL.md)) |

Search by component name and by the job (`SearchInput`, `ListAddButton`, `ItemList`, `CustomDialog`, `FeaturePage`, `EditableSectionCard`). Prefer a real file path over a similar-looking new component.

## Decision

| What you find | Do this |
|---------------|---------|
| Same UI is already a component in this app | Import it. Do not copy the JSX. |
| Same UI is an export from the kit | Import the kit. Do not rebuild it in the feature. |
| Same markup is inlined in two or more places | Extract it, update those call sites, then use it for the new feature. |
| Primitive missing from the kit and needed by more than one service | Stop and hand it to [ui-kit-agent](../../agents/ui-kit-agent.md) (web) or [mobile-agent](../../agents/mobile-agent.md) (`packages/mobile-ui`). |
| Nothing similar | Compose kit primitives. Keep new UI in one component so the next feature can reuse it. |

## Where the extracted component lives

| Used by | Place |
|---------|--------|
| One feature | `features/<module>/components/` |
| Two features in the same app | `shared/components/` (features import `@/shared/...`, not each other) — [front-end-structure.mdc](../../rules/front-end-structure.mdc) |
| Two or more services, or a control the kit already owns | `@webonone/ui-kit` or `@webonone/mobile-ui` |

Leave domain-only flow in the feature. Move only the repeated UI.

## Report

```text
UI reuse report
- Screen: [page | dialog | list | form | control]
- Similar UI: [path — or none]
- Kit export: [name — or none]
- Action: reuse | extract-then-reuse | add-to-kit | compose-kit
- Component: [existing or new path]
- Call sites to update: [paths — or none]
- Implement with: [imports the feature must use]
```

The feature summary must include this report. A new local copy of an existing component is not done.

## Verification

From the touched frontend workspace:

```bash
npm run type-check
npm run lint
```

Mobile kit changes: `npm run type-check -w @webonone/mobile-ui`. UI kit changes: `npm run build -w @webonone/ui-kit` and `npm run type-check -w ui-kit-root`.
