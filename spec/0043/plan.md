# Plan — Feedback 0043

## Current behavior

Web `CustomDialog` footer is `flex justify-end` (nowrap), but many dialogs pass a child `div` with `flex flex-wrap`, so Cancel / Previous / Next wrap on a narrow phone. `DialogFooter` and `AlertDialogFooter` use `flex-col-reverse` until `sm`, which stacks each action on its own line. `AlertDialogCancel` adds `mt-2` for that stack.

Native `CustomDialog` footer is `flex-row flex-wrap`. Dialog footers repeat `flex-row flex-wrap justify-end gap-2`. `Button` renders string labels in `Text` without `numberOfLines={1}`, so a squeezed label breaks onto two lines inside the control.

`dialog-windows.mdc` currently tells authors to wrap long footers with `flex-wrap`.

## Approach

Keep footer actions on one row in the shared chrome, and stop dialog-specific footer rows from opting back into wrap. Button labels stay single-line. If a row is wider than the dialog, the footer scrolls horizontally instead of wrapping.

Do not change `AppEndPanel` (stacked full-width panel actions) or non-dialog `flex-wrap` toolbars.

## Implementation steps

1. Web `CustomDialog` footer: `flex-nowrap items-center overflow-x-auto`, and force a direct child flex row to `flex-nowrap`. Buttons in that footer: `shrink-0 whitespace-nowrap`.
2. `DialogFooter` and `AlertDialogFooter`: one `flex-row flex-nowrap` at all breakpoints. Drop `mt-2` on `AlertDialogCancel`.
3. Native `CustomDialog` footer: `flex-nowrap` (no `flex-wrap`). `Button` string labels: `numberOfLines={1}`.
4. Replace dialog-only footer `flex-wrap` with `flex-nowrap` in web form dialogs (`webonone-v2`, `data`, `identity`) and native dialog footers (`mobile`, `mobile-ui` `DateField` / `CatalogReviewDialog`). Leave `MemberCompanyCatalogPanel` and non-dialog screens alone.
5. Update `dialog-windows.mdc` and `mobile-dialogs.mdc`: footer actions stay one row; do not use `flex-wrap` on dialog footers.
6. Type-check and lint the touched workspaces.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Three long labels on a 320px-wide dialog may scroll inside the footer instead of wrapping. That matches the ticket.
- Sinhala labels stay one line and can scroll with the row.
