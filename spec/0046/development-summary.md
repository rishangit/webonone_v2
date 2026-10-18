# Development summary — 0046

| Field | Value |
|-------|-------|
| Ticket | `0046` |
| Feedback id | `LQcvX7IINxGDBKS4wejgm` |
| Title | Web page submenu item list page has not related button |
| Type | `bug` |
| Completed | 2026-10-18 |

## What was delivered

Company admins no longer see the blank create-form button on the Website submenu lists for Pages, Layouts, Headers, Footers, and Presets. Those lists keep **Add from library** and row **Duplicate**. Super Admin still sees **Add page**, **Add layout**, **Add header**, **Add footer**, and **Add preset** so the shared library can grow. Themes, Data Sets, Media, and Settings are unchanged.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging | WebOnOne → **Website** → Pages, Layouts, Headers, Footers, or Presets (company admin). Super Admin: same items, create-form button still present. |
| Standalone Design | `npm run dev:design` |
| Mobile | Drawer → those Website children. Company admin has no create-form button; Super Admin does. |
| Support | `/docs/website-forms/website-pages`, `/docs/website-forms/website-layouts`, `/docs/website-forms/headers-footers`, `/docs/website-forms/website-presets` (`en` and `si`) |

## Feature details

- Company admin add path on those five lists: **Duplicate** an existing row, or **Add from library**.
- Super Admin create-form buttons stay on those lists. Super Admin does not see **Add from library**.
- Themes (**Add theme**), Data Sets (**Add data set**), Media, and Settings are unchanged.
- Mobile matches the same role gate. Mobile does not have **Add from library**.

## Code and docs touched

| Area | Paths |
|------|--------|
| `design/frontend` | `WebsitePagesPage`, `WebsiteLayoutsPage`, `WebsiteChromePage`, `WebsitePresetsPage` |
| `mobile/` | `useDesignPermissions`, matching website screens |
| `support/` | `website-pages`, `website-layouts`, `headers-footers`, `website-presets` (`en` + `si`) |
| `spec/0046/` | `spec.md`, `plan.md`, this file |

## Verification run

```bash
npm run type-check -w design-root
npm run lint -w @webonone/design-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w support-root
```

`@webonone/mobile` has no `lint` script. Design frontend lint passed.

## Deploy

`npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` reported `mode=none` because the ticket changes were still uncommitted. Path detection of this commit’s files (`npm run deploy:detect -- --files … --print`) is the expected runtime result.

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0046: remove unrelated website list add button` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | `design, support` |
| **Why** | `changed services: design,support` — `mobile/` and `spec/` are ignored for IIS |
| Detect command | `npm run deploy:detect -- --files <ticket paths> --print` (HEAD vs `origin/deploy_staging` was an empty diff before this commit) |

## Support status

`staging` after a successful push to `deploy_staging`. `closed` stays with a super admin.
