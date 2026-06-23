# Agent delegation map

This monorepo has four runnable services, a shared UI library, and shared contract packages under `packages/`. Each service has a **subagent** (`.cursor/agents/`) and a **skill** (`.cursor/skills/`). Agents and skills are scoped by service folder and `.cursor/rules/` — they do not depend on `spec/`.

**Orchestrator:** [.cursor/agents/platform-orchestrator.md](.cursor/agents/platform-orchestrator.md) · [skill](.cursor/skills/platform-orchestrator/SKILL.md)

## Shared packages (`packages/`)

Cross-service libraries that are **not** UI Kit and **not** microservices. See [packages/README.md](packages/README.md).

| Package | Purpose |
|---------|---------|
| `@webonone/platform-nav` | Cross-service redirect, auth-code handoff, return URL validation |
| `@webonone/media-embed` | Media iframe embed URL builder, postMessage types, React hooks |

Root: `npm run build:platform-nav`, `npm run build:media-embed`. Parent agent owns new entries under `packages/*`.

### Cross-cutting skills

| Skill | Description |
|-------|-------------|
| [form-creation](.cursor/skills/form-creation/SKILL.md) | Matching Zod validation on frontend + backend, required-field asterisks, inline errors via `@webonone/ui-kit` |
| [item-list](.cursor/skills/item-list/SKILL.md) | Gapped glass-card list rows, themed shadow hover, per-item 3-dot menus via `ItemList` primitives |

## Service agents

| Agent | Root | Subagent | Skill |
|-------|------|--------|-------|
| Identity | `identity/` | [identity-agent](.cursor/agents/identity-agent.md) | [skill](.cursor/skills/identity-agent/SKILL.md) |
| UI Kit | `ui-kit/` | [ui-kit-agent](.cursor/agents/ui-kit-agent.md) | [skill](.cursor/skills/ui-kit-agent/SKILL.md) |
| WebOnOne v2 | `webonone-v2/` | [webonone-agent](.cursor/agents/webonone-agent.md) | [skill](.cursor/skills/webonone-agent/SKILL.md) |
| Media | `media/` | [media-agent](.cursor/agents/media-agent.md) | [skill](.cursor/skills/media-agent/SKILL.md) |

## What the parent agent does

1. Classify which service roots the task affects.
2. Delegate to the matching subagent (or use the Task tool with the agent skill).
3. Keep root `package.json` / workspace wiring in the parent unless the task is service-only.
4. Merge subagent results and run verification.

## Dev commands (repo root)

| Command | Runs |
|---------|------|
| `npm run dev` | All four services |
| `npm run dev:identity` | Identity FE + BE |
| `npm run dev:ui-kit` | UI Kit showcase |
| `npm run dev:webonone` | WebOnOne FE + BE |
| `npm run dev:media` | Media FE + BE |
| `npm run build:platform-nav` | Build `@webonone/platform-nav` |
| `npm run build:media-embed` | Build `@webonone/media-embed` |
