---
name: help-articles
description: >-
  Keep the public Support help site in sync with user-facing product changes
  (new screens, nav items, roles, POS, catalog). Use whenever a WebOnOne (or
  peer-in-shell) feature that customers see is added, renamed, or behaves
  differently — write or update Markdown articles in support/.
---

# Help articles (Support)

Public how-tos live in the **Support** service, not in WebOnOne. Shipping a user-visible feature without matching help is incomplete.

Authoritative rule: [help-articles.mdc](../../rules/help-articles.mdc). Article format: [support-agent skill](../support-agent/SKILL.md).

## When docs are required

Update Support if the change is something a signed-in user (or Super Admin) would notice:

- New or renamed **left-nav** item, route, or page (example: Analytics)
- New **workflow** (POS, register company, log into company, calendar queue)
- **Role** differences (owner vs member vs Super Admin see different UI)
- Labels, date ranges, charts, or **money** meaning (revenue vs profit)
- Removing or relocating a screen (point old articles at the new place)

## When docs are not required

- Internal APIs, migrations, Redux, epics, Vite chunks, tests
- Copy-only i18n with no behavior change
- Pure bug fixes that do not change how the product is used
- Deploy / IIS / `npm run dev` (never in public articles)

If unsure, **document**. A short article plus cross-links is enough.

## Who writes the files

| Agent | Action |
|-------|--------|
| **webonone-agent** (and other product agents) | Implement the feature. Do **not** skip the docs check. If scoped to one service, return `Support docs: required` with slug, audience, and bullets for the article. |
| **support-agent** or **parent** | Add/update `support/frontend/src/content/en/**/*.md` and matching `si/` files in the **same task**. Catalog is `import.meta.glob` — no `catalog.ts` edit. |
| **platform-orchestrator** | After user-facing WebOnOne (or peer) work, delegate **support-agent** unless the product agent already reported `Support docs: not needed`. |

## How to write

1. Grep `support/frontend/src/content` for the feature name, nav label, and related pages.
2. New page → new article (`category` from `HELP_CATEGORIES` in `support/frontend/src/features/docs/content/types.ts`). Mirror **en** and **si** paths.
3. Frontmatter: `title`, `category`, `slug`, `audience` (`all` \| `owner` \| `staff` \| `member` \| `super_admin`), `order`, `summary`.
4. Body: numbered steps a user can follow; link related articles (`/docs/{category}/{slug}`).
5. Patch **left-navigation**, **what-is-webonone**, **dashboard**, glossary, and sibling how-tos when the nav or home story changed.
6. Verify: `npm run type-check -w support-root`. Open `http://127.0.0.1:3021/docs/{category}/{slug}` if Support is running.

Reference: Analytics — `support/frontend/src/content/en/app-preferences/analytics.md`.
