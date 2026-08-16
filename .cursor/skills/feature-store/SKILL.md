---
name: feature-store
description: >-
  Builds standard Redux feature stores for list/detail CRUD resources using the
  shared @webonone/store-kit factories (createCatalogFeatureStore for
  list+detail+create/update/delete, createPaginatedFeatureStore for list-only
  paginated reads) plus the useEpicCatalogList / useEpicCatalogEditor hooks, with
  Tier-2 epic composition for extra behavior. Use when adding or editing a Redux
  slice, epics, feature store, list page, or detail/editor for a paginated
  resource in any service frontend, or when reducing hand-written slice + epics
  boilerplate for CRUD features.
---

# Feature store (shared store-kit)

Standard workflow for **list/detail CRUD features** in any service frontend. Do **not** hand-roll a slice plus list/detail/save/delete epics — use the shared factories from `@webonone/store-kit`. Each service keeps its own `configureStore`, API client, and domain types, so services stay standalone; the package only supplies state plumbing (no domain logic, no store instance).

Authoritative rule: [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc). Package build order: [microservice-architecture.mdc](../../rules/microservice-architecture.mdc).

## When to apply

- Adding a new paginated resource with list + detail + create/update/delete → `createCatalogFeatureStore`.
- Adding a list-only paginated read (history, logs, activity) → `createPaginatedFeatureStore`.
- A CRUD feature needs extra async behavior (versions, preview, toggle) → base factory + Tier-2 compose.

## When NOT to apply (stay hand-written)

- Bespoke query models not `q`/`status`/`extra` (e.g. Identity `users` `search`/`role`).
- Single-object settings (e.g. Email `providers`), dual-list/wizard flows (e.g. WebOnOne `companies`).
- Unpaginated lists (e.g. Email `templates` list returning a plain array), and `auth`.

Never copy a factory or `cacheUtils` into a service — import from `@webonone/store-kit`. A service `@/shared/store/cacheUtils.ts` may only re-export from the package.

## One-time service wiring (if the service does not yet consume store-kit)

1. Add `"@webonone/store-kit": "*"` to `<service>/frontend/package.json` dependencies.
2. Add a Vite alias in `<service>/frontend/vite.config.ts`:
   `{ find: '@webonone/store-kit', replacement: path.join(storeKitRoot, 'src/index.ts') }`.
3. Chain `npm run build:store-kit --prefix ..` before the frontend build in `<service>/package.json` `build`.
4. `npm install` at repo root.

## Add a CRUD feature (createCatalogFeatureStore)

```ts
// features/<domain>/store/<domain>Store.ts
import { createCatalogFeatureStore } from '@webonone/store-kit'
import { serviceApi } from '@/shared/services/serviceApi'
import type { Thing } from '@/shared/types/service.types'

export const thingsStore = createCatalogFeatureStore<Thing>({
  name: 'things',
  list: (q) => serviceApi.listThings(q),
  get: (id) => serviceApi.getThing(id),
  create: (body) => serviceApi.createThing(body),
  update: (id, body) => serviceApi.updateThing(id, body),
  delete: (id) => serviceApi.deleteThing(id),
})

export const { reducer: thingsReducer, actions: thingsActions, epics: thingsEpics } = thingsStore
```

`features/<domain>/store/index.ts` re-exports the three symbols. `list` must return `PaginatedResult<T>` (`items`, `total`, `page`, `pageSize`).

## Add a list-only feature (createPaginatedFeatureStore)

```ts
import { createPaginatedFeatureStore } from '@webonone/store-kit'

export const historyStore = createPaginatedFeatureStore<HistoryItem>({
  name: 'history',
  list: (query) => serviceApi.getHistory({
    page: query.page, pageSize: query.pageSize, status: query.status,
    from: query.extra?.from, to: query.extra?.to,
  }),
  // cacheTtlMs: 15_000, // optional shorter TTL for live data
})
```

## Tier-2 composition (extra behavior on a CRUD base)

Build the base store, then compose extra epics — never fork the factory.

```ts
export const templatesStore = createCatalogFeatureStore<Template>({ name: 'templates', /* CRUD */ })
const previewEpic: Epic = (action$) => /* feature-specific */
export const templatesEpics = combineEpics(templatesStore.epics, previewEpic, versionsEpic)
```

## Pages and dialogs (hooks)

List page and detail/editor dialog use the shared hooks; keep a thin `RootState`-typed wrapper under `@/shared/hooks/` so page selectors keep full typing:

```ts
// @/shared/hooks/useEpicCatalogList.ts
import { useEpicCatalogList as base, type CatalogFeatureState, type CatalogListActions } from '@webonone/store-kit'
import type { RootState } from '@/app/store'
export function useEpicCatalogList<T>(
  selectState: (s: RootState) => CatalogFeatureState<T>, actions: CatalogListActions,
) { return base<T, RootState>(selectState, actions) }
```

```ts
const list = useEpicCatalogList((s) => s.things, thingsActions)       // list page
const editor = useEpicCatalogEditor<Thing>(id, isNew, (s) => s.things, thingsActions) // dialog
```

Collection pages use **`ListPageFooter`** (not raw `Pagination`) with `list.loadMore`, `list.hasMore`, `list.loadingMore`. Appearance `on-scroll` appends pages; `pagination` keeps the pager. See [item-list-pagination.mdc](../../rules/item-list-pagination.mdc).

## List append (on-scroll)

`loadListRequested({ append?: boolean })` on both factories:

| Request | Reducer | Epic |
|---------|---------|------|
| Page **1** (or omit `append`) | **replace** `items` | `switchMap` (cancels in-flight) |
| `append: true` and `page > 1` | **concat** + **dedupe by `id`** | `exhaustMap` (ignore extra scroll while a page is in flight) |

Do not set `page` on the slice when `append` is true until success (avoids a page jump if load-more fails). Filter / search / pageSize change still `dispatchLoad(1)` replace. Mode switch → reload page 1 replace (`onModeChange` on `ListPageFooter`). Overlay loading stays first-page-only (`items.length === 0`).

`useEpicCatalogList` exposes `loadMore()`, `hasMore` (`items.length < total`), `loadingMore` (`listStatus === 'loading' && items.length > 0`).

Client-sliced lists (no API pages): `useClientListPage(items)` — on-scroll grows `slice(0, loadedCount)` via `nextVisibleCount`. Hand-written list stores that use `ListPageFooter` must implement the same replace-vs-append on success. Queue poll in on-scroll must not wipe appended rows (refetch page 1 with `pageSize = max(loadedCount, 12)`, or skip poll-replace while `items.length > pageSize`).

Do **not** import ui-kit from store-kit.

## Register in the store (unchanged per-service ownership)

```ts
// app/store/index.ts
reducer: { things: thingsReducer, /* ... */ }
// app/store/epics/rootEpic.ts
export const rootEpic = combineEpics(/* ... */ thingsEpics)
```

## Verification

```bash
npm run build:store-kit
npm run type-check -w <service>-root
npm run lint
```

Reference implementation: Data catalog features (`data/frontend/src/features/{tags,units,attributes,products,services,spaces}/store/*Store.ts`), Email `history` (`email/frontend/src/features/history/store/historyStore.ts`).
