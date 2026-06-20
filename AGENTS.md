# Agent delegation map

This monorepo has three runnable services, a shared UI library, and shared contract packages under `packages/`. Each service has a **subagent** (`.cursor/agents/`) and a **skill** (`.cursor/skills/`). Agents and skills are scoped by service folder and `.cursor/rules/` — they do not depend on `spec/`.

**Orchestrator:** [.cursor/agents/platform-orchestrator.md](.cursor/agents/platform-orchestrator.md) · [skill](.cursor/skills/platform-orchestrator/SKILL.md)

## Shared packages (`packages/`)

Cross-service libraries that are **not** UI Kit and **not** microservices. See [packages/README.md](packages/README.md).

| Package | Purpose |
|---------|---------|
| `@webonone/platform-nav` | Cross-service redirect, auth-code handoff, return URL validation |

Root: `npm run build:platform-nav`. Parent agent owns new entries under `packages/*`.

## Service agents

| Agent | Root | Subagent | Skill |
|-------|------|--------|-------|
| Identity | `identity/` | [identity-agent](.cursor/agents/identity-agent.md) | [skill](.cursor/skills/identity-agent/SKILL.md) |
| UI Kit | `ui-kit/` | [ui-kit-agent](.cursor/agents/ui-kit-agent.md) | [skill](.cursor/skills/ui-kit-agent/SKILL.md) |
| WebOnOne v2 | `webonone-v2/` | [webonone-agent](.cursor/agents/webonone-agent.md) | [skill](.cursor/skills/webonone-agent/SKILL.md) |

## What the parent agent does

1. Classify which service roots the task affects.
2. Delegate to the matching subagent (or use the Task tool with the agent skill).
3. Keep root `package.json` / workspace wiring in the parent unless the task is service-only.
4. Merge subagent results and run verification.

## Dev commands (repo root)

| Command | Runs |
|---------|------|
| `npm run dev` | All three services |
| `npm run dev:identity` | Identity FE + BE |
| `npm run dev:ui-kit` | UI Kit showcase |
| `npm run dev:webonone` | WebOnOne FE + BE |
| `npm run build:platform-nav` | Build `@webonone/platform-nav` |
