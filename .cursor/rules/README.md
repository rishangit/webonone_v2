# Cursor rules index

## Always apply

| Rule | Description |
|------|-------------|
| [cursor-rules.mdc](cursor-rules.mdc) | How to add, edit, and maintain rules (self-contained; no `spec/` links) |
| [code-cleanliness.mdc](code-cleanliness.mdc) | Path aliases, focused diffs, no dead code or empty folders |
| [microservice-architecture.mdc](microservice-architecture.mdc) | Standalone services, secure data passing (JWT, events, iframe/postMessage), shared-package build order |

## Service projects

| Rule | Globs | Description |
|------|-------|-------------|
| [identity-project.mdc](identity-project.mdc) | `identity/**/*` | Identity ports, auth/embed ownership, verification |
| [ui-kit-project.mdc](ui-kit-project.mdc) | `ui-kit/**/*` | Package vs showcase, build/export workflow |
| [webonone-v2-project.mdc](webonone-v2-project.mdc) | `webonone-v2/**/*` | Scaffold, iframe login, JWT verify |
| [media-project.mdc](media-project.mdc) | `media/**/*` | Media service ports, embed routes, storage |
| [email-project.mdc](email-project.mdc) | `email/**/*` | Email service ports, platform shell nav, queue/SMTP |

## Deployment

| Rule | Globs | Description |
|------|-------|-------------|
| [iis-deployment.mdc](iis-deployment.mdc) | `**/deploy/**/*` | IIS staging, env, web.config, deploy verification (all services) |

Agent delegation map: [AGENTS.md](../../AGENTS.md)

## Front-end (`**/frontend/src`)

| Rule | Globs | Description |
|------|-------|-------------|
| [ui-kit-consumption.mdc](ui-kit-consumption.mdc) | `**/frontend/src/**/*.{ts,tsx}` | Mandatory `@webonone/ui-kit` usage for all service frontends |
| [front-end-structure.mdc](front-end-structure.mdc) | `**/frontend/src/**/*.{ts,tsx}` | `src/` layout, feature modules, `shared/` boundaries |
| [feature-page-layout.mdc](feature-page-layout.mdc) | `**/frontend/src/features/**/pages/**/*.{ts,tsx}` | `FeaturePage` / `PageHeader` for AppShell feature pages |
| [item-list-pagination.mdc](item-list-pagination.mdc) | `**/frontend/src/features/**/*.{ts,tsx}` | `Pagination` below `ItemList` on collection pages |
| [list-filter-panel.mdc](list-filter-panel.mdc) | `**/frontend/src/features/**/*.{ts,tsx}` | `ListFilterPanel` + trigger on collection pages |
| [loading-empty-states.mdc](loading-empty-states.mdc) | `**/frontend/src/**/*.{ts,tsx}` | Unified platform loading overlay; `LoadingState`; `ItemListEmpty` |
| [react-typescript.mdc](react-typescript.mdc) | `**/frontend/**/*.{ts,tsx}` | Components, TypeScript, hooks, forms |
| [tailwind-css.mdc](tailwind-css.mdc) | `**/frontend/src/**/*.{ts,tsx}` | Tailwind utilities, tokens, shadcn/ui styling |
| [dialog-windows.mdc](dialog-windows.mdc) | `**/frontend/src/**/*.{ts,tsx}`, `ui-kit/showcase/**/*.{ts,tsx}` | CustomDialog / AlertDialog layout, stacked siblings, pointer fall-through dismiss guard, iframe embed footer + crop height chain, footer, sizing, wizard/tab |
| [redux-store-and-epics.mdc](redux-store-and-epics.mdc) | `**/frontend/src/**/*.{ts,tsx}` | RTK slices, redux-observable epics, mandatory for all API I/O |
| [platform-shell-navigation.mdc](platform-shell-navigation.mdc) | `**/frontend/src/**/*.{ts,tsx}` | Canonical redirect pattern (Profile reference); same layout + file roles for every peer |
| [frontend-vite-chunk-splitting.mdc](frontend-vite-chunk-splitting.mdc) | `**/frontend/**/*.{ts,tsx}` | Route lazy-load + `manualChunks`; no 500 kB build warnings |

Applies to `identity/frontend`, `webonone-v2/frontend`, `media/frontend`, `email/frontend`, and any future `*/frontend` apps.

## Backend (`backend/`)

| Rule | Globs | Description |
|------|-------|-------------|
| [nodejs-express.mdc](nodejs-express.mdc) | `backend/**/*.{ts,js}` | Express layout, REST, JWT, handlers |
| [mysql-database-architecture.mdc](mysql-database-architecture.mdc) | `backend/**/{migrations,prisma,models,db,repositories}/**` | MySQL schema, nanoid, migrations, per-service DB |

## Agents (`.cursor/agents/` + `.cursor/skills/`)

Each service has a **subagent** (system prompt) and a **skill** (workflow). Scoped by service folder and `.cursor/rules/` — independent of `spec/`.

| Agent | Subagent | Skill |
|-------|----------|-------|
| Platform orchestrator | [platform-orchestrator](../agents/platform-orchestrator.md) | [skill](../skills/platform-orchestrator/SKILL.md) |
| Identity | [identity-agent](../agents/identity-agent.md) | [skill](../skills/identity-agent/SKILL.md) |
| UI Kit | [ui-kit-agent](../agents/ui-kit-agent.md) | [skill](../skills/ui-kit-agent/SKILL.md) |
| WebOnOne v2 | [webonone-agent](../agents/webonone-agent.md) | [skill](../skills/webonone-agent/SKILL.md) |

### Cross-cutting skills

| Skill | Description |
|-------|-------------|
| [form-creation](../skills/form-creation/SKILL.md) | Matching Zod validation on frontend + backend, required-field asterisks, inline errors via `@webonone/ui-kit` |
| [item-list](../skills/item-list/SKILL.md) | Gapped glass-card list rows, themed shadow hover, per-item 3-dot menus via `ItemList` primitives |
| [feature-store](../skills/feature-store/SKILL.md) | Standard list/detail CRUD stores via `@webonone/store-kit` factories (`createCatalogFeatureStore`, `createPaginatedFeatureStore`), Tier-2 epic composition |

Delegation map: [AGENTS.md](../../AGENTS.md)

## Cross-links (avoid duplicating these topics)

| Topic | Authoritative rule |
|-------|-------------------|
| One DB per service, events, JWT, iframe/postMessage | `microservice-architecture.mdc` |
| Identity ↔ WebOnOne integration | `microservice-architecture.mdc`, `identity-project.mdc`, [platform-shell-navigation.mdc](platform-shell-navigation.mdc) |
| Core nav / auth-code handoff between services | [platform-shell-navigation.mdc](platform-shell-navigation.mdc) — Profile is reference; all peers mirror same three layers |
| Tables, migrations, nanoid `CHAR(21)` | `mysql-database-architecture.mdc` |
| Express routes, JWT, HTTP errors | `nodejs-express.mdc` |
| Feature folders, `@/shared` between features | `front-end-structure.mdc` |
| Feature page layout (`FeaturePage`, `PageHeader`) | `feature-page-layout.mdc` |
| Slices, epics, `rootEpic` | `redux-store-and-epics.mdc` |
| Shared CRUD store factories (`@webonone/store-kit`) | `redux-store-and-epics.mdc`, [feature-store skill](../skills/feature-store/SKILL.md) |
| Tailwind, shadcn/ui, responsive layout | `tailwind-css.mdc` |
| `@webonone/ui-kit` consumption (all service frontends) | `ui-kit-consumption.mdc` |
| `@/` imports, unused code cleanup | `code-cleanliness.mdc` |
| Vite chunk splitting (lazy routes, manualChunks) | `frontend-vite-chunk-splitting.mdc` |
| Forms (Zod FE + BE validation, FormField) | [form-creation skill](../skills/form-creation/SKILL.md) |
| Date fields (`DatePicker`, not `Input type="date"`) | `ui-kit-consumption.mdc`, [form-creation skill](../skills/form-creation/SKILL.md) |
| Item lists (gap, glass-card, shadow hover, 3-dot menus) | [item-list skill](../skills/item-list/SKILL.md) |
| Loading and empty states (unified overlay, `LoadingState`, `ItemListEmpty`) | [loading-empty-states.mdc](loading-empty-states.mdc) |
| Dialog sizing, scroll, nested guards, stacked crop | `dialog-windows.mdc` |
