# 02 — Frontend chunk splitting

Technical requirements for Vite production builds across all service frontends.

---

## Problem

Each SPA uses static imports in `router.tsx` (or `App.tsx` routes), pulling every feature page into one Rollup chunk. Shared dependencies (`react`, UI Kit, Redux, React Router) compound the size. Vite/Rollup warns when any chunk exceeds 500 kB after minification.

---

## Solution (two layers)

Apply **both** layers in every in-scope frontend. Either alone may not clear the warning.

### Layer 1 — Route lazy loading

Replace static page imports with `React.lazy` and wrap route trees in `Suspense`.

**Pattern (WebOnOne reference — adapt paths per service):**

```tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PageLoader } from '@webonone/ui-kit' // or existing loading primitive

const HomePage = lazy(() => import('@/features/home/pages/HomePage').then((m) => ({ default: m.HomePage })))
const BasicSettingsPage = lazy(() =>
  import('@/features/settings/basic/pages/BasicSettingsPage').then((m) => ({ default: m.BasicSettingsPage }))
)
// ... other feature pages

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}
```

**Eager (do not lazy-load):**

- Login, auth callback, and embed-only minimal routes needed before shell hydration.
- `AppLayout` shell — keep eager so authenticated shell renders immediately.

**Guards:**

- Keep `PrivateRoute` / `SuperAdminRoute` **outside** lazy boundaries (wrap `Lazy` child, not parent), so redirects run before chunk fetch when unauthenticated.

| Service | Router file | Lazy candidates |
|---------|-------------|-----------------|
| WebOnOne v2 | `webonone-v2/frontend/src/app/router.tsx` | `HomePage`, `CompaniesPage`, `BasicSettingsPage`, `SystemThemePage` |
| Identity | `identity/frontend/src/app/router.tsx` | Profile, register, reset-password pages (not login embed entry) |
| Email | `email/frontend/src/app/router.tsx` | Dashboard, templates, history, queue, settings feature pages |
| Media | `media/frontend/src/app/router.tsx` | Library, picker, upload, admin pages |

Audit each service’s router for **all** statically imported feature pages and convert them.

---

### Layer 2 — `manualChunks` in Vite

Add to each `frontend/vite.config.ts`:

```ts
export default defineConfig({
  // ... existing plugins, resolve, server
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-dom')) return 'vendor-react-dom'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('react-redux') || id.includes('@reduxjs/toolkit')) return 'vendor-redux'
          if (id.includes('react')) return 'vendor-react'
          if (id.includes('@radix-ui')) return 'vendor-radix'
          // Optional: group remaining node_modules
          return 'vendor-misc'
        },
      },
    },
  },
})
```

**Rules:**

- Function must be **identical in spirit** across services; copy to all four `vite.config.ts` files (no shared config package in 1.10.0 — avoid new package scope).
- Do not chunk workspace aliases (`@webonone/ui-kit` src alias) into separate Rollup chunks in dev-only paths; they resolve to source and roll into app chunks at build time after package `dist/` is used in production pipeline.
- Re-run build after changes; tune chunk names if Rollup creates circular chunk warnings.

---

## Per-service checklist

| Step | WebOnOne | Identity | Email | Media |
|------|----------|----------|-------|-------|
| Lazy feature routes | ✓ | ✓ | ✓ | ✓ |
| `manualChunks` in vite.config | ✓ | ✓ | ✓ | ✓ |
| `npm run build -w *-root` no >500 kB warning | ✓ | ✓ | ✓ | ✓ |
| `npm run type-check -w *-root` | ✓ | ✓ | ✓ | ✓ |
| Smoke: navigate all main routes in dev | ✓ | ✓ | ✓ | ✓ |

---

## Forbidden / discouraged

| Approach | Why |
|----------|-----|
| Only `chunkSizeWarningLimit: 1000` | Hides problem; explicitly excluded by ClickUp |
| Lazy-loading `AppLayout` | Breaks shell UX; guards depend on layout context |
| Shared monorepo `vite.config.shared.ts` | Out of scope for 1.10.0; duplicate config is acceptable |

---

## Verification command

```bash
npm run build -w webonone-v2-root 2>&1 | findstr /i "500 kB"
npm run build -w identity-root    2>&1 | findstr /i "500 kB"
npm run build -w email-root       2>&1 | findstr /i "500 kB"
npm run build -w media-root       2>&1 | findstr /i "500 kB"
```

Empty output = success on Windows. On Unix: `grep -i '500 kB'` should return no matches.

---

## ClickUp mapping

| ClickUp | ID | Spec section |
|---------|-----|--------------|
| Parent — chunk splitting | 86ey4yz5q | Layer 1–2, checklist |
