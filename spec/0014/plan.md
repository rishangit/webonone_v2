# Plan — Feedback 0014

## Approach

Change the shared compact `ListAddButton` implementations so the collapsed mobile state is icon-only (Plus), then expand to the full children label on first tap. Keep `variant="default"` / primary gradient. Update kit showcase copy and agent docs that still say **+ Add**.

## Implementation steps

1. **`ui-kit/package/src/components/ListAddButton.tsx`**
   - Collapsed compact: render Plus only; square-ish control (`h-9 w-9`, padding overrides) matching toolbar icon geometry while keeping `btn-primary-gradient`.
   - Animate label column from `0fr` → `1fr` for **children** only (drop intermediate `compactLabel` text).
   - First click still `expandAdd()`; second runs `onClick` + `collapseAdd`.
   - Keep optional `compactLabel` prop for call-site compat; unused in collapsed UI (document in JSDoc).
   - Remove `labelsMatch` shortcut that skipped expand when labels were equal — always icon → full → action when compact.

2. **`packages/mobile-ui/src/components/ListAddButton.tsx`**
   - Mirror: collapsed = Plus only on primary `Button` (square `min-w` / padding like icon control); expanded animates full children label width.
   - Same press / expand / collapse contract with `useListPageActions`.

3. **Showcase + docs**
   - `ui-kit/showcase` Components / page demo descriptions: “+ only until tapped”.
   - Update `.cursor/rules/feature-page-layout.mdc`, `list-filter-panel.mdc`, `.cursor/skills/item-list/SKILL.md`, `.cursor/skills/ui-kit-agent/SKILL.md` compact CTA wording.

4. **Verify** — type-check/lint ui-kit; type-check mobile-ui (+ mobile if needed). No Support help article (none describe compact Add).

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Width animation must not leave a ghost gap beside the Plus when collapsed (`gap-0` / zero label column).
- Call sites that pass `compactLabel={tc('add')}` keep compiling; prop ignored for collapsed paint.
- Theme-editor rows with `compactOnMobile={false}` stay always-expanded — no change.
