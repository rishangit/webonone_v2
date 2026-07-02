# 01 — Overview (1.10.0)

## Vision

Every platform SPA currently ships one large JavaScript bundle (~590–625 kB minified) because routes and heavy dependencies are statically imported. Production builds emit Rollup’s chunk-size warning and slow first paint. Split the bundle into cacheable vendor chunks and on-demand route chunks so initial load stays small and builds are warning-free.

## User story

As a platform engineer, I want production frontend builds to code-split large bundles so that users download less JavaScript on first visit and `npm run build` no longer reports chunks over 500 kB.

## Goals (1.10.0)

1. **Remove build warning** — no output chunk exceeds 500 kB after minification on any of the four service frontends.
2. **Route-level splitting** — feature pages load via `React.lazy` + `Suspense`; login/callback stay eagerly loaded for fast auth path.
3. **Vendor splitting** — `build.rollupOptions.output.manualChunks` isolates stable dependencies (`react`, `react-dom`, `react-router-dom`, `@reduxjs/toolkit`, `react-redux`, Radix/UI Kit peer graph as applicable).
4. **Consistent pattern** — same router and Vite conventions across `webonone-v2`, `identity`, `email`, and `media` frontends.
5. **No warning suppression** — do **not** rely on `build.chunkSizeWarningLimit` as the primary fix; only acceptable if a single third-party chunk remains >500 kB after all splits (document exception in PR).

## Baseline (measured on master)

| Service | Single JS chunk (minified) |
|---------|---------------------------|
| WebOnOne v2 | 620.48 kB |
| Identity | 618.46 kB |
| Email | 590.79 kB |
| Media | 624.95 kB |

## Scope (1.10.0)

### In scope

- `*/frontend/vite.config.ts` — `build.rollupOptions.output.manualChunks` function.
- `*/frontend/src/app/router.tsx` (or equivalent) — lazy route components with loading fallback (`PageLoader` from UI Kit or minimal inline spinner matching existing patterns).
- Verification via `npm run build -w <service-root>` for all four services.

### Out of scope (1.10.0)

- UI Kit package (`ui-kit/package`) tsup bundle changes.
- Backend or API changes.
- Service worker / prefetch strategy.
- Micro-frontend federation or shared runtime across origins.
- Dynamic import of `@webonone/ui-kit` at package level (aliases stay; split at route + vendor level only).

## Glossary

| Term | Definition |
|------|------------|
| **Vendor chunk** | Rollup output chunk for `node_modules` dependencies grouped by `manualChunks` |
| **Route chunk** | Async chunk loaded when user navigates to a lazy-wrapped page |
| **Entry chunk** | Initial JS required for shell, router, and auth-critical routes |

## Success criteria

1. `npm run build -w webonone-v2-root` completes with **no** `Some chunks are larger than 500 kB` warning.
2. Same for `identity-root`, `email-root`, `media-root`.
3. Largest minified JS chunk per service is ≤ 500 kB (or documented exception with rationale).
4. Lazy routes render correctly after navigation; auth guards (`PrivateRoute`, `SuperAdminRoute`, etc.) still wrap lazy children.
5. `npm run type-check` passes for each touched service root.
6. Dev (`npm run dev`) behavior unchanged — Vite handles lazy imports in dev without extra config.

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — build chunk splitting | 86ey4yz5q | All docs |

### Source requirements (from ClickUp parent)

1. Use `import()` / dynamic imports to code-split the application.
2. Use `build.rollupOptions.output.manualChunks` to improve chunking ([Rollup docs](https://rollupjs.org/configuration-options/#output-manualchunks)).
3. Raising `build.chunkSizeWarningLimit` is a last resort only — not the default solution.
