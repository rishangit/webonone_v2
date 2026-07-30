# Agent delegation map

This monorepo has five runnable services, a shared UI library, and shared contract packages under `packages/`. Each service has a **subagent** (`.cursor/agents/`) and a **skill** (`.cursor/skills/`). Agents and skills are scoped by service folder and `.cursor/rules/` — they do not depend on `spec/`.

**Orchestrator:** [.cursor/agents/platform-orchestrator.md](.cursor/agents/platform-orchestrator.md) · [skill](.cursor/skills/platform-orchestrator/SKILL.md)

## Shared packages (`packages/`)

Cross-service libraries that are **not** UI Kit and **not** microservices. See [packages/README.md](packages/README.md).

| Package | Purpose |
|---------|---------|
| `@webonone/platform-nav` | Cross-service redirect, auth-code handoff, return URL validation |
| `@webonone/platform-embed` | Platform nav iframe embed URL builder, JWT postMessage, PlatformServiceFrame |
| `@webonone/media-embed` | Media iframe embed URL builder, postMessage types, React hooks |
| `@webonone/store-kit` | Redux slice + redux-observable epics factories for list/detail CRUD (`createCatalogFeatureStore`, `createPaginatedFeatureStore`), cache utils, catalog hooks |

Root: `npm run build:platform-nav`, `npm run build:platform-embed`, `npm run build:media-embed`, `npm run build:store-kit`. Parent agent owns new entries under `packages/*`.

### Cross-cutting skills

| Skill | Description |
|-------|-------------|
| [core-hosted-peer-dialog](.cursor/skills/core-hosted-peer-dialog/SKILL.md) | Any dialog box / dialog window (create/edit/wizard/selection) in a peer FE — host chrome + `/embed/dialogs/…` body when embedded in WebOnOne |
| [form-creation](.cursor/skills/form-creation/SKILL.md) | Matching Zod validation on frontend + backend, required-field asterisks, inline errors via `@webonone/ui-kit` |
| [item-list](.cursor/skills/item-list/SKILL.md) | Gapped glass-card list rows, themed shadow hover, per-item 3-dot menus via `ItemList` primitives |
| [details-page-cards](.cursor/skills/details-page-cards/SKILL.md) | Profile/details pages: `Card` sections in 3-col left(2)+right(1) stacks, equal `gap-6`, page-level Edit |
| [details-page-wizard-edit](.cursor/skills/details-page-wizard-edit/SKILL.md) | Wizard-backed details: per-card Edit opens shared create/edit wizard at mapped step |
| [feature-store](.cursor/skills/feature-store/SKILL.md) | List/detail CRUD stores via `@webonone/store-kit` factories (`createCatalogFeatureStore`, `createPaginatedFeatureStore`), Tier-2 epic composition |
| [toast-notifications](.cursor/skills/toast-notifications/SKILL.md) | UI Kit `useToast` for mutation API success/fail; soft warnings stay silent |

## Service agents

| Agent | Root | Subagent | Skill |
|-------|------|--------|-------|
| Identity | `identity/` | [identity-agent](.cursor/agents/identity-agent.md) | [skill](.cursor/skills/identity-agent/SKILL.md) |
| UI Kit | `ui-kit/` | [ui-kit-agent](.cursor/agents/ui-kit-agent.md) | [skill](.cursor/skills/ui-kit-agent/SKILL.md) |
| WebOnOne v2 | `webonone-v2/` | [webonone-agent](.cursor/agents/webonone-agent.md) | [skill](.cursor/skills/webonone-agent/SKILL.md) |
| Media | `media/` | [media-agent](.cursor/agents/media-agent.md) | [skill](.cursor/skills/media-agent/SKILL.md) |
| Data | `data/` | [data-agent](.cursor/agents/data-agent.md) | [skill](.cursor/skills/data-agent/SKILL.md) |
| SMS | `sms/` + `mobile/` | [sms-agent](.cursor/agents/sms-agent.md) | [skill](.cursor/skills/sms-agent/SKILL.md) |
| Payment | `payment/` | [payment-agent](.cursor/agents/payment-agent.md) | [skill](.cursor/skills/payment-agent/SKILL.md) |

Company registration, memberships, platform roles, and super-admin approval are a **WebOnOne v2 feature** (backend + Basic Settings UI). See [spec/1.6.0](../spec/1.6.0/README.md).

## What the parent agent does

1. Classify which service roots the task affects.
2. Delegate to the matching subagent (or use the Task tool with the agent skill).
3. Keep root `package.json` / workspace wiring in the parent unless the task is service-only.
4. Merge subagent results and run verification.

## Dev commands (repo root)

| Command | Runs |
|---------|------|
| `npm run dev` | All five services |
| `npm run dev:identity` | Identity FE + BE |
| `npm run dev:ui-kit` | UI Kit showcase |
| `npm run dev:webonone` | WebOnOne FE + BE |
| `npm run dev:media` | Media FE + BE |
| `npm run dev:data` | Data FE + BE |
| `npm run dev:sms` | SMS FE + BE |
| `npm run dev:payment` | Payment FE + BE |
| `npm run mobile` | Mobile Expo app (not in root `dev`) |
| `npm run mobile:web` | Mobile app via RN Web |
| `npm run build:platform-nav` | Build `@webonone/platform-nav` |
| `npm run build:platform-embed` | Build `@webonone/platform-embed` |
| `npm run build:media-embed` | Build `@webonone/media-embed` |
