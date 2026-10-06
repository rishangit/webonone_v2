# Plan — Feedback 0007

## Approach

Frontend-only UI polish in Support. Rework `FeedbackList` rows to follow ItemList conventions (`ItemListStatus` for status; leading Lucide type icon). Small help-article wording tweak if needed. No API or ui-kit package changes.

## Implementation steps

1. **Update** `support/frontend/src/features/feedback/components/FeedbackList.tsx`:
  - Import `Bug` / `Lightbulb` from `lucide-react` and `ItemListStatus` from `@webonone/ui-kit`.
  - Leading type icon (left of `ItemListContent`): `h-5 w-5 shrink-0 self-start`, color via existing type variants or muted/primary tokens; `aria-hidden` with type conveyed by `aria-label` on the row button or a visually adjacent label.
  - Keep ticket `#` tag + title (+ unread chip) in the content column; remove the inline type `StatusTag` once the icon is present.
  - Move status `StatusTag` into `<ItemListStatus>` as the last child before `FeedbackStatusMenu` / `ItemListMenu`.
  - Preserve description, screenshot `ImagePreview`, and reporter/date lines.

2. **Optional helper** in `feedbackStatus.ts` (only if it keeps the component clean): map `FeedbackType` → icon component.

3. **Help** — update `support/frontend/src/content/{en,si}/getting-started/report-feedback.md` “View reports” to mention bug/feature icons on the left and status on the right (one sentence).

4. **Verify** with type-check and lint on Support workspaces.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before editing Support FE | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Super Admin rows already have a trailing menu — `ItemListStatus` must sit immediately before it (same as TagsList).
- Do not put status inside the clickable content button if that breaks menu/status hit targets; follow TagsList sibling structure.
