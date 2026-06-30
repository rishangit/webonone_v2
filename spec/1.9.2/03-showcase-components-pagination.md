# 03 — Showcase Components tab pagination demo (1.9.2)

Pagination demo belongs on the **Components** showcase tab (with `ItemList`), not only Controls.

## Requirements

| Requirement | Detail |
|-------------|--------|
| Location | `ui-kit/showcase/src/pages/ComponentsPage.tsx` — new `DemoSection` after Item list |
| Demo | Interactive `Pagination` below a sample `ItemList` (paginated slice of mock themes) |
| Page size | `onPageSizeChange` with options `[12, 24, 48]` |
| Remove duplicate | Remove Pagination section from `ControlsPage.tsx` (Controls = inputs; Components = composite patterns) |

## Acceptance

- [ ] Components tab shows Item list + `Pagination` together
- [ ] Controls tab no longer duplicates Pagination demo
- [ ] `npm run type-check -w ui-kit-root` passes

## ClickUp

Subtask **86ey3ypk3** — need to add the pagination to the ui-kit component showcase.
