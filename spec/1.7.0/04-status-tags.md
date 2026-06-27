# 04 — Status tags (UI Kit)

Follow-up subtask **86ey2yv18** — semantic **status tags** with theme-aware glass styling and a dedicated showcase tab.

---

## Component — `StatusTag`

Export **`StatusTag`** from `@webonone/ui-kit` for compact status labels (approval workflows, list rows, detail headers).

### Visual design

| Property | Rule |
|----------|------|
| Surface | Light translucent background with **glass effect** (`glass-card` pattern — `hsl(var(--glass-bg))` + backdrop blur) |
| Border | **Same hue as the status**, darker shade — not generic `glass-border` alone |
| Text | Status hue at readable contrast on the tinted background |
| Theme | Must adapt in **light**, **dark**, and **system** themes via showcase `ThemeToolbar` |

### Variants (group 1 — approval workflow)

| Variant | Label | Semantic meaning |
|---------|-------|------------------|
| `pending` | Pending | Awaiting review / not yet decided |
| `rejected` | Rejected | Denied / failed approval |
| `approved` | Approved | Accepted / passed approval |

Each variant owns a distinct color family (amber for pending, red for rejected, green for approved). Colors use CSS variables or Tailwind tokens so dark mode tints remain legible.

### API (minimum)

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `variant` | `'pending' \| 'rejected' \| 'approved'` | required | Selects color group |
| `children` | `ReactNode` | variant label | Override display text |
| `className` | `string` | — | Consumer layout override |

Render as inline `<span>` with `rounded-md px-2.5 py-0.5 text-xs font-medium`.

---

## Showcase — Tags tab

Add a new top-level showcase tab:

| Tab ID | Label |
|--------|-------|
| `tags` | Tags |

Update `showcase-nav.ts` and `ShowcaseApp.tsx`:

- Register `tags` in `SHOWCASE_TABS` and `ShowcaseTab` union.
- Add `Tabs.Content value="tags"` rendering **`TagsPage`**.

### TagsPage content

| Section | Detail |
|---------|--------|
| Status tags — group 1 | Row of `pending`, `rejected`, `approved` tags side by side |
| Theme note | Short copy: switch theme toolbar to verify glass + border colors |

Hash routing: `http://localhost:3002/#tags`

---

## Out of scope

| Item | Reason |
|------|--------|
| Additional status groups | Only group 1 defined in ClickUp subtask |
| WebOnOne / Identity integration | Showcase + export only; consumers adopt later |
| Clickable / removable tags | Display-only labels |

---

## Files

| Path | Change |
|------|--------|
| `ui-kit/package/src/components/StatusTag.tsx` | New component |
| `ui-kit/package/src/index.ts` | Export `StatusTag`, `StatusTagVariant` |
| `ui-kit/showcase/src/components/showcase-nav.ts` | Add `tags` tab |
| `ui-kit/showcase/src/pages/ShowcaseApp.tsx` | Wire Tags tab |
| `ui-kit/showcase/src/pages/TagsPage.tsx` | Demo page |

---

## Acceptance

- [ ] `StatusTag` exports from `@webonone/ui-kit`
- [ ] Three variants render with distinct semantic colors
- [ ] Glass background + darker same-hue border in light and dark themes
- [ ] Showcase **Tags** tab shows group 1 row
- [ ] `npm run build -w @webonone/ui-kit` and `npm run type-check -w ui-kit-root` pass
