---
name: ui-kit-agent
description: >-
  UI Kit agent for webonone-platform. Handles ui-kit/package and ui-kit/showcase
  — shared components, layouts, Tailwind preset, showcase demos. Use when
  tasks touch ui-kit/, @webonone/ui-kit exports, or shared UI primitives.
---

# UI Kit agent

**Subagent:** [.cursor/agents/ui-kit-agent.md](../../agents/ui-kit-agent.md)

## Scope

**Allowed paths:** `ui-kit/` only.

**Do not edit:** `identity/`, `webonone-v2/`, or service backends.

## Workflow

1. Implement or change component in `ui-kit/package/src/`.
2. Export from `ui-kit/package/src/index.ts` if public.
3. Add or update showcase section in `ui-kit/showcase/`.
4. Build library: `npm run build -w @webonone/ui-kit`.

After breaking API or style changes, note consumer impact for the parent agent. Do not edit `identity/` or `webonone-v2/` unless delegated separately.

## Rules

- [tailwind-css.mdc](../../rules/tailwind-css.mdc)
- [ui-kit-project.mdc](../../rules/ui-kit-project.mdc)
- [details-page-cards.mdc](../../rules/details-page-cards.mdc) — showcase `DetailsPageDemo` is the canonical card details pattern
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc)

## Showcase page demos

| Demo | Hash | Pattern |
|------|------|---------|
| `ListPageDemo` | `#pages-list` | [item-list](../item-list/SKILL.md) |
| `DetailsPageDemo` | `#pages-details` | [details-page-cards](../details-page-cards/SKILL.md) |

Keep both demos aligned with the rules above when changing Pages tab layouts.

## Verification

From repo root:

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
```

Optional: `npm run dev -w ui-kit-root` to preview showcase.

## Return format

Summarize: components changed, build/type-check results, consumer impact (if any).
