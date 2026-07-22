# 05 — UI Kit company status tags

Upgrade the UI Kit **Tags** showcase tab with **company status tags**, then use that primitive everywhere company status is shown in WebOnOne (All Companies + super-admin Companies).

## Problem

Company lists today use **hand-rolled** status chips (`span` + local `statusClassName` / `statusLabel` helpers). Colors and labels drift between pages and do not match the kit’s Tags demo. Consumers need one exported control for **Pending / Approved / Rejected**.

## Solution

| Layer | Action |
|-------|--------|
| **UI Kit package** | Ensure `StatusTag` is the canonical **company status tag** (`variant`: `pending` \| `approved` \| `rejected`) — polish if needed; keep default labels Pending / Approved / Rejected |
| **UI Kit showcase Tags tab** | Upgrade `TagsPage` so the primary section is **Company status tags** documenting the three variants (light + dark via theme toolbar) |
| **WebOnOne** | Replace all company status chips with `<StatusTag variant={status} />` |

Existing starter code may already export `StatusTag` and a minimal Tags demo — **1.13.0 still requires** the showcase upgrade + consumer migration below (treat gaps as build work).

## UI Kit — `StatusTag` contract

**File:** `ui-kit/package/src/components/StatusTag.tsx`  
**Export:** `@webonone/ui-kit` → `StatusTag`, `StatusTagVariant`, `statusTagVariants`

| Prop | Behavior |
|------|----------|
| `variant` | `'pending'` \| `'approved'` \| `'rejected'` (default `pending`) |
| `children` | Optional override label; default = Pending / Approved / Rejected |
| Visual | Glass-tinted background + semantic border; readable in light and dark theme |

```tsx
<StatusTag variant="pending" />
<StatusTag variant="approved" />
<StatusTag variant="rejected" />
```

### Mapping from company API

| `companies.status` | `StatusTag` variant |
|--------------------|---------------------|
| `pending` | `pending` |
| `approved` | `approved` |
| `rejected` | `rejected` |

Do **not** invent extra variants for company approval in 1.13.0. Other future status groups (e.g. queue jobs) may get separate tag variants later — out of scope here.

### Upgrade checklist (package)

- [ ] Variants cover all three company statuses
- [ ] Default labels match product copy (Pending / Approved / Rejected)
- [ ] Exported from `ui-kit/package/src/index.ts`
- [ ] Accessible as a non-interactive status label (`span` is fine; no button semantics)
- [ ] Build: `npm run build -w @webonone/ui-kit`

Optional polish (in scope if quick): rename showcase wording to “Company status”; add a one-line JSDoc on `StatusTag` pointing to company approval use.

## Showcase — Tags tab

**File:** `ui-kit/showcase/src/pages/TagsPage.tsx`  
**Nav:** existing showcase tab `tags` / label **Tags** (`showcase-nav.ts`)

### Required demo section

| Section | Content |
|---------|---------|
| **Company status tags** | Show all three: Pending, Approved, Rejected via `StatusTag` |
| Description | State that these tags are for **company registration approval** status; use theme toolbar to verify light/dark |
| Layout | `flex flex-wrap gap-3` row of the three tags |

Optional second section (keep if already useful): other tag primitives (`SelectTag`, etc.) — do not remove unrelated tag demos if present; **company status** must be the first / clearest section.

### Acceptance (showcase)

1. Showcase → **Tags** shows **Company status tags** with Pending, Approved, Rejected.
2. Tags remain legible in light and dark theme.
3. No hand-rolled company status chip in the Tags demo — only `StatusTag`.

## WebOnOne consumption (required)

Use `StatusTag` for every company status chip:

| Surface | File (approx.) | Change |
|---------|----------------|--------|
| All Companies list | `MyCompaniesList.tsx` | `<StatusTag variant={item.status} />` |
| Super-admin Companies list | `CompaniesList.tsx` | Replace local `statusLabel` / `statusClassName` spans |
| Any leftover Basic Settings company card | If status still shown | Same `StatusTag` |

```tsx
import { StatusTag } from '@webonone/ui-kit'

// item.status is 'pending' | 'approved' | 'rejected'
<StatusTag variant={item.status} />
```

### Forbidden

- Local `bg-muted` / `bg-primary/15` / `bg-destructive/15` status pills for company status
- Duplicate CSS copies of `statusTagVariants` in WebOnOne
- Using generic `Badge` for company approval status when `StatusTag` exists

## Build order

1. UI Kit package + Tags showcase (this doc)
2. `npm run build -w @webonone/ui-kit` (or service root `build:ui-kit` chain)
3. WebOnOne All Companies + migrate super-admin `CompaniesList`

## Acceptance

1. Tags tab documents company status tags (three variants).
2. All Companies rows use `StatusTag`.
3. Super-admin Companies rows use `StatusTag`.
4. No hand-rolled company status chip classes remain in those lists.
5. `npm run type-check -w ui-kit-root` and `npm run type-check -w webonone-v2-root` pass.
