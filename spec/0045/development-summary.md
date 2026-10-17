# Development summary — 0045

| Field | Value |
|-------|-------|
| Ticket | `0045` |
| Feedback id | `Zdn72lmkWnfD3sXHM6uPD` |
| Title | Keep all tabs under the website’s main menus |
| Type | `feature` |
| Completed | 2026-10-17 |

## What was delivered

Website is a left-nav group. Company and member menus list Pages, Layouts, Headers, Footers, Presets, Data Sets, Themes, Media, and Settings. Super Admin sees Pages, Layouts, Headers, Footers, Presets, and Themes. Each item opens that section’s existing list or settings page. The horizontal section tab bar is gone. A member with no company still does not see Website.

## Where to see it

| Surface | Where |
|---------|--------|
| Staging | WebOnOne left nav → **Website** → a section (company account). Super Admin: same group without Data Sets, Media, or Settings. |
| Standalone Design | `npm run dev:design` → Website group |
| Mobile | Drawer → Website children (native list screens) |
| Support | `/docs/app-preferences/left-navigation`, `/docs/website-forms/website-pages`, `/docs/website-forms/website-layouts`, `/docs/website-forms/headers-footers`, `/docs/website-forms/website-presets`, `/docs/website-forms/website-datasets`, `/docs/website-forms/website-themes` |

## Feature details

- Company and member children, in order: Pages, Layouts, Headers, Footers, Presets, Data Sets, Themes, Media, Settings.
- Super Admin children: Pages, Layouts, Headers, Footers, Presets, Themes.
- List search, filter, and add stay on each page.
- Editing a page, header, footer, preset, or theme keeps that submenu item active.
- English and Sinhala nav labels cover the new children.

## Code and docs touched

| Area | Paths |
|------|--------|
| `packages/platform-nav` | `coreNav.ts`, `sessionRoleNav.ts`, tests |
| `packages/i18n` | `translateNavItems.ts`, `locales/{en,si}/common.json` |
| `webonone-v2/frontend` | `features/shell/config/navItems.ts` |
| `design/frontend` | standalone nav, `WebsiteHubTabs`, website pages |
| `identity/`, `email/`, `data/` frontends | core nav icons |
| `mobile/` | drawer icons; hub tabs removed |
| `support/` | website and left-navigation articles (`en` + `si`) |
| `spec/0045/` | spec, plan, this summary |

## Verification run

```bash
npm run test -w @webonone/platform-nav
npm run type-check -w @webonone/platform-nav
npm run lint -w @webonone/platform-nav
npm run type-check -w @webonone/i18n
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w design-root
npm run lint -w @webonone/design-frontend
npm run type-check -w @webonone/mobile
npm run type-check -w identity-root
npm run type-check -w email-root
npm run type-check -w data-root
npm run type-check -w support-root
```

`@webonone/mobile` has no `lint` script. Browser click-through was not run in this session.

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0045: Keep all tabs under the website’s main menus` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `selective` |
| **Services** | identity, webonone, media, email, data, sms, payment, website, design, ai, support |
| **Why** | Shared libraries `i18n` (all IIS frontends) and `platform-nav` (identity, webonone, data, design, ai, website, support). `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` was `mode=none` (empty diff) before this commit; the same detector on the pending paths returned `selective` with the services above. |
| Detect command | `npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print` |

## Support status

`developed` until the push to `deploy_staging` succeeds, then `staging`.
