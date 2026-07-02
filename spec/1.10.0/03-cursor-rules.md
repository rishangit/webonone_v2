# 03 — Cursor rules for chunk splitting

Document the Vite chunk-splitting pattern in `.cursor/rules/` so future frontend work follows the same approach.

---

## Requirement (ClickUp subtask)

Update related rules files or create a new rule so agents apply route lazy-loading and `manualChunks` when adding feature pages or new service frontends.

---

## Deliverable

| File | Purpose |
|------|---------|
| `.cursor/rules/frontend-vite-chunk-splitting.mdc` | Standalone rule: lazy routes, `manualChunks`, eager exceptions, verification |
| `.cursor/rules/README.md` | Index entry for the new rule |

---

## Rule content (minimum)

1. **Route lazy-load** — feature pages use `React.lazy` + `Suspense` with UI Kit `Spinner` fallback via a local `LazyRoute` helper.
2. **Eager routes** — login, callback, embed entry paths (`/picker`, `/upload`, …) stay statically imported.
3. **Guards** — `PrivateRoute` / `RoleRoute` wrap `LazyRoute`, not the reverse.
4. **Vite** — every service `frontend/vite.config.ts` includes `build.rollupOptions.output.manualChunks` (vendor split function).
5. **Forbidden** — raising `chunkSizeWarningLimit` as the primary fix.
6. **Verification** — `npm run build -w <service-root>` must not emit the 500 kB warning.

---

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Subtask: update the rules | 86ey50q2u | This doc, Phase 6 |
