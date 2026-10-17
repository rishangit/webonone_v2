# Development summary — Feedback 0044

| Field | Value |
|-------|-------|
| Ticket | `0044` |
| Feedback id | `fPa1BE31wTL8VuRQtz1pJ` |
| Title | Promote the Forms and Website menu items |
| Type | `feature` |
| Completed | 2026-10-17 |

## What was delivered

The left navigation no longer has a Design group. Company owners and company staff see **Forms** and **Website** as their own rows. Super Admin sees **Website** only. A member with no company still does not see either item. The same routes (`/design/forms`, `/design/website`) open those screens on web and in the mobile drawer.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging | WebOnOne left nav: **Forms** and **Website** (company session). Super Admin: **Website** only. |
| Support docs | `/docs/app-preferences/left-navigation`, `/docs/website-forms/forms`, `/docs/website-forms/website-pages` (en and si) |
| Local | `npm run dev:webonone` — sidebar after signing in as a company owner. Mobile drawer uses the same nav defs. |

## Feature details

- Forms and Website sit where the Design group sat (after Payment on company nav; Website after Data on Super Admin nav).
- Forms still opens the Design forms app. Website still opens the website designer.
- Default users keep Calendar and Settings and do not get Forms or Website.
- Standalone Design already listed Forms and Website at the top level.

## Code and docs touched

| Area | Paths |
|------|--------|
| `packages/platform-nav` | `src/coreNav.ts`, `src/sessionRoleNav.ts`, tests, `src/index.ts` |
| `webonone-v2/` | `frontend/src/features/shell/config/navItems.ts` |
| `mobile/` | `src/features/shell/navIcons.ts`, `src/features/peer/peerDestinations.ts` |
| `support/` | Left-nav and website/forms how-tos under `frontend/src/content/en` and `si` |
| Spec | `spec/0044/spec.md`, `spec/0044/plan.md`, `spec/0044/development-summary.md` |

## Verification run

```bash
npm run test -w @webonone/platform-nav
npm run type-check -w @webonone/platform-nav
npm run lint -w @webonone/platform-nav
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

`@webonone/mobile` has no `lint` script. WebOnOne lint reported existing hook warnings and no errors. Signed-in sidebar click-through was not run in a browser; nav shape is covered by `platform-nav` tests.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0044: promote Forms and Website menu items` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | identity, webonone, data, website, design, ai, support |
| **Why** | `packages/platform-nav` is a shared library that fans out to those services. `mobile/` and `spec/` are ignored for IIS. `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` was `mode=none` (empty diff) because the change was still uncommitted; the working-tree file list produced this selective result. |
| Detect command | `npm run deploy:detect -- --files <working-tree paths> --print` |

## Support status

`staging` after a successful push to `deploy_staging`. `closed` stays with a super admin.
