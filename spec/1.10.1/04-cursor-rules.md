# 04 — Cursor rules for list filter panel

Document the list filter pattern in `.cursor/rules/` so agents add filters consistently on new collection pages.

---

## Deliverables

| File | Purpose |
|------|---------|
| `.cursor/rules/list-filter-panel.mdc` | When to use panel; integration with `FeaturePage`, `ItemList`, `Pagination` |
| `.cursor/rules/README.md` | Index entry |
| `.cursor/skills/item-list/SKILL.md` | Cross-link filter rule; checklist bullet |

---

## Rule content (minimum)

1. **Required on list pages** — any `FeaturePage` with `ItemList` + collection data must include `ListFilterTrigger` in `actions` and `ListFilterPanel` for filter fields.
2. **No inline filter forms** — do not add full-width filter `<Form>` rows above lists; use the panel.
3. **Active state** — derive `active` from filter state; highlight trigger when any criterion ≠ default.
4. **Apply behavior** — reset pagination to page 1; refetch (server) or re-slice (client).
5. **Exceptions** — document in spec if a page is not a collection list (forms, embeds, single-card pages).
6. **Verification** — `npm run type-check -w <service-root>`.

---

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — enforce via rules | 86ey58rda | This doc, Phase 5 |
