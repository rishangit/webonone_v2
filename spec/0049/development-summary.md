# Development summary — 0049

| Field | Value |
|-------|-------|
| Ticket | `0049` |
| Feedback id | `s5P-_i1IaGHC3t49zVNAH` |
| Title | Lint issue fails CI pipeline |
| Type | `bug` |
| Completed | 2026-10-20 |

## What was delivered

CI failed because Media `SelectorPage` called `useEffect` after an early return (waiting for embed auth), which violates `react-hooks/rules-of-hooks`. The ResizeObserver / `CONTENT_SIZE` effect now runs with the other hooks before any conditional return. `npm run lint` for Media and the monorepo root exits 0.

## Where to see it

| Surface | How |
|---------|-----|
| Staging CI | Push to `deploy_staging` → GitHub Actions **CI** job Lint step should pass |
| Local | `npm run lint -w @webonone/media-frontend` |
| Media picker (optional smoke) | `npm run dev:media` — embed picker list-page still reports content height to parent when authenticated |

No Support help article (CI / developer tooling fix only).

## Feature details

- Hooks order on `SelectorPage` is unconditional every render.
- Effect still no-ops until `listPage`, `parentOrigin`, and the content node exist.
- Auth spinner for embedded unauthenticated state is unchanged.

## Code and docs touched

| Root | Paths |
|------|-------|
| `media/frontend` | `src/features/media/pages/SelectorPage.tsx` |
| `spec/0049/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run lint -w @webonone/media-frontend
npm run type-check -w media-root
npm run lint
```

All exited 0.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0049: Lint issue fails CI pipeline` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `media` |
| **Why** | Product change under `media/` (SelectorPage); `spec/` does not map to IIS. Predicted with `deploy:detect --files` because uncommitted HEAD vs `origin/deploy_staging` was empty before the single commit. |
| Detect command | `npm run deploy:detect -- --files <paths-to-commit> --print` (pre-commit); post-push CI Deploy detect confirms against the new SHA |

## Support status

`staging` after successful push to `deploy_staging` (`closed` remains super admin).
