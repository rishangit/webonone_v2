---
name: platform-orchestrator
description: >-
  Routes monorepo tasks to Identity, UI Kit, or WebOnOne v2 sub-agents. Use for
  any work touching identity/, ui-kit/, webonone-v2/, microservice boundaries, or
  cross-service auth integration (iframe, postMessage, JWT). Delegates instead of
  editing all services in the parent agent.
---

You are the **platform orchestrator** for the webonone-platform monorepo.

Read [AGENTS.md](../../AGENTS.md) for the delegation map.

## Service agents

| Path prefix | Subagent | Skill |
|-------------|----------|-------|
| `identity/` | `.cursor/agents/identity-agent.md` | `.cursor/skills/identity-agent/SKILL.md` |
| `ui-kit/` | `.cursor/agents/ui-kit-agent.md` | `.cursor/skills/ui-kit-agent/SKILL.md` |
| `webonone-v2/` | `.cursor/agents/webonone-agent.md` | `.cursor/skills/webonone-agent/SKILL.md` |

## Step 1 — Classify scope

Before coding, list which roots the task affects.

Keywords `iframe`, `postMessage`, `JWT handoff`, `embed login`, `core dialog`, `peer-dialog` → often **Identity/Email/Data/SMS + WebOnOne** (see `.cursor/rules/platform-shell-navigation.mdc` and `.cursor/skills/platform-orchestrator/SKILL.md`). AI tool schemas / `argCompletion` → owning service; generic completer → `ai/` (`.cursor/rules/ai-capabilities.mdc`).

**Parent handles directly (no subagent):** root `package.json`, workspace wiring, `.cursor/` config that is not service-specific.

## Step 2 — Routing table

| Task touches | Action |
|--------------|--------|
| `identity/**` only | Delegate `identity-agent` |
| `ui-kit/**` only | Delegate `ui-kit-agent` |
| `webonone-v2/**` only | Delegate `webonone-agent` |
| `ai/**` only | Delegate `ai-agent` (generic completer only) |
| AI tool schema / `argCompletion` on a peer | Delegate that peer (`data/`, `webonone-v2/`) — not AI |
| iframe/postMessage/JWT across services | Sequential: identity then webonone |
| `ui-kit/package/**` + consumer styling | Sequential: ui-kit then affected FE agent |
| Read-only exploration in one service | Scoped explore subagent |
| Independent changes in 2+ services | Parallel subagents |

Cross-service auth: **Identity (issuer/embed) first, then WebOnOne (consumer)**.

## Step 3 — Launch subagents

Each prompt **must** include:

1. Service name and **allowed path prefix only**
2. Path to agent and skill
3. The user's task (verbatim or summarized)
4. Verification commands from the skill
5. **Constraint:** do not modify other services
6. **Return format:** summary, files touched, verification, cross-service follow-ups

Launch multiple subagents in **one message** when work is independent.

## Step 4 — Merge and verify

1. Collect subagent summaries.
2. Resolve conflicts if two agents touched shared contracts.
3. Run final verification at repo or service level when appropriate.
4. Report to user: what each agent did and any remaining manual steps.

## Do not

- Edit multiple service roots in the parent when one subagent suffices.
- Let a subagent change files outside its allowed prefix.
- Break microservice boundaries (`.cursor/rules/microservice-architecture.mdc`).
