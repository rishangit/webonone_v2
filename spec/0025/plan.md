# Plan — Feedback 0025

## Approach

Keep the assistant on the existing desktop in-flow `AppEndPanel` rail. Add an opt-in expand mode that (1) shows Maximize/Minimize next to Close on desktop, (2) drops `max-w-sm` and takes `flex-1`, and (3) hides `#main-content` via `:has(.app-shell-end-panel--expanded)` so the panel grows to the sidebar edge and tracks sidebar width automatically.

## Implementation steps

1. **`ui-kit/package/src/layouts/AppEndPanel.tsx`**
   - Props: `expandable?`, `expanded?`, `onExpandedChange?`, `expandLabel?`, `collapseLabel?`.
   - Desktop-only header button (Maximize2 / Minimize2) left of Close when `expandable` and not slide-over.
   - When `expanded` + desktop + not slide-over: class `app-shell-end-panel--expanded` and `md:max-w-none md:min-w-0 md:flex-1`.

2. **`ui-kit/package/src/styles/globals.css`**
   - `.app-shell-body:has(.app-shell-end-panel--expanded) > #main-content { display: none; }` (or equivalent flex collapse) so expanded rail fills remaining body width beside the sidebar.

3. **`webonone-v2/.../AppAssistant.tsx`**
   - Local `expanded` state; reset when `open` becomes false.
   - Pass expand props + labels from `shell` i18n (`assistant.expand` / `assistant.collapse`).

4. **i18n** — `webonone-v2/frontend/src/locales/{en,si}/shell.json` expand/collapse strings.

5. **Help** — update `support/.../ai-assistant.md` (`en` + `si`) with one step for desktop expand.

6. **Verify** — type-check/lint on ui-kit, webonone-v2, support.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Expand is opt-in so peer filter panels and website assistant stay narrow unless they opt in.
- `:has()` is supported in current evergreen browsers used by the product shell.
