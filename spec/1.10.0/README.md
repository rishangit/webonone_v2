# WebOnOne Platform — Specification (1.10.0)

Production **Vite build chunk splitting** for all service frontends. Eliminates the Rollup warning that JS bundles exceed 500 kB after minification by splitting vendor and route chunks — not by raising `chunkSizeWarningLimit`.

**Spec No:** 1.10.0

Implementation branch: **`spec/1.10.0`**

## What changed from 1.9.4

| Area | 1.9.4 | 1.10.0 |
|------|-------|--------|
| Frontend build | Single ~600 kB JS chunk per service | Route lazy-load + vendor `manualChunks` |
| Router | Static page imports | `React.lazy` + `Suspense` per route |
| Vite config | No `build.rollupOptions` | Shared chunk strategy per `frontend/vite.config.ts` |
| Build warning | `(!) Some chunks are larger than 500 kB` on all four SPAs | No chunk exceeds 500 kB (post-gzip target documented per phase) |

## Projects affected

| Project | Role in 1.10.0 |
|---------|----------------|
| **WebOnOne v2** (`webonone-v2/frontend/`) | Route code-splitting; manual vendor chunks (~620 kB → split) |
| **Identity** (`identity/frontend/`) | Same pattern (~618 kB → split) |
| **Email** (`email/frontend/`) | Same pattern (~591 kB → split) |
| **Media** (`media/frontend/`) | Same pattern (~625 kB → split) |

UI Kit showcase (`ui-kit/showcase/`) is out of scope unless its build also exceeds 500 kB after the service rollout.

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Vision, goals, scope, glossary, success criteria |
| [02-frontend-chunk-splitting.md](./02-frontend-chunk-splitting.md) | `manualChunks`, route lazy-load, per-service checklist |
| [03-cursor-rules.md](./03-cursor-rules.md) | `.cursor/rules/` documentation for future development |
| [07-implementation-plan.md](./07-implementation-plan.md) | Phases, branch workflow, acceptance checklist |
| [plan.mdc](./plan.mdc) | Agent implementation plan |

## ClickUp traceability

| ClickUp | ID | Spec destination |
|---------|-----|------------------|
| Parent: [User Story] Spec No 1.10.0 | 86ey4yz5q | All docs |
| Subtask: update the rules | 86ey50q2u | `03-cursor-rules.md`, Phase 6 |

## Revision history

- **2026-07-02** — Added subtask `update the rules` (cursor rule for chunk-splitting pattern).

## Inherited from earlier specs

| Doc | Topic |
|-----|-------|
| [../1.8.0/02-feature-page-layout.md](../1.8.0/02-feature-page-layout.md) | Feature pages under AppShell (lazy targets) |
| [../1.9.4/03-nav-and-permissions.md](../1.9.4/03-nav-and-permissions.md) | Route guards remain on lazy-wrapped routes |

## Rules reference

| Topic | Rule |
|-------|------|
| Microservice boundaries | `microservice-architecture.mdc` |
| Per-service env / build | `microservice-architecture.mdc` (package `dist/` before prod build) |
| IIS deploy | `iis-deployment.mdc` |
| Vite chunk splitting | `frontend-vite-chunk-splitting.mdc` (new in 1.10.0) |

## Local dev

```bash
npm run build -w webonone-v2-root   # Verify no >500 kB chunk warning
npm run build -w identity-root
npm run build -w email-root
npm run build -w media-root
```
