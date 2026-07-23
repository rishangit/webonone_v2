---
name: platform-orchestrator
description: >-
  Routes monorepo tasks to Identity, UI Kit, WebOnOne v2, or Media sub-agents via
  Cursor Task tool. Use for any work in this repo touching identity/, ui-kit/,
  webonone-v2/, media/, microservice boundaries, or cross-service auth/media integration.
  Delegates automatically instead of editing all services in the parent agent.
---

# Platform orchestrator

**Subagent:** [.cursor/agents/platform-orchestrator.md](../../agents/platform-orchestrator.md)

Read [AGENTS.md](../../../AGENTS.md).

## Step 1 — Classify scope

| Path prefix | Subagent | Skill |
|-------------|----------|-------|
| `identity/` | `.cursor/agents/identity-agent.md` | `.cursor/skills/identity-agent/SKILL.md` |
| `ui-kit/` | `.cursor/agents/ui-kit-agent.md` | `.cursor/skills/ui-kit-agent/SKILL.md` |
| `webonone-v2/` | `.cursor/agents/webonone-agent.md` | `.cursor/skills/webonone-agent/SKILL.md` |
| `media/`, `packages/media-embed/` | `.cursor/agents/media-agent.md` | `.cursor/skills/media-agent/SKILL.md` |

Keywords: iframe, postMessage, JWT handoff, embed login, platform nav, auth-code redirect → often **Identity + WebOnOne** or **platform-shell-navigation** rule. Media picker embed → **Media + consumer FE**. Embedded-peer dialogs that should feel core-owned → **platform-embed contract + WebOnOne host dialog + requesting peer**.

**Parent handles directly:** root `package.json`, workspace wiring, non-service `.cursor/` config.

## Step 2 — Routing table

| Task touches | Action | Subagent type |
|--------------|--------|---------------|
| `identity/**` only | Delegate identity-agent | `generalPurpose` |
| `ui-kit/**` only | Delegate ui-kit-agent | `generalPurpose` |
| `webonone-v2/**` only | Delegate webonone-agent | `generalPurpose` |
| `media/**` or `packages/media-embed/**` only | Delegate media-agent | `generalPurpose` |
| Media embed in consumer | Sequential: media then consumer FE agent | `generalPurpose` × 2 |
| iframe/postMessage/JWT across services | Sequential: identity then webonone | `generalPurpose` × 2 |
| `ui-kit/package/**` + consumer styling | Sequential: ui-kit then affected FE agent | `generalPurpose` × 2 |
| Read-only exploration in one service | Scoped explore | `explore` |
| Independent changes in 2+ services | Parallel subagents | `generalPurpose` (parallel) |

## Step 3 — Launch subagents

Each prompt **must** include:

1. Service name and **allowed path prefix only**
2. Path to agent + skill
3. The user's task
4. Verification commands from the skill
5. **Constraint:** do not modify other services
6. **Return format:** summary, files touched, verification, cross-service follow-ups

Sequence cross-service work: Identity before WebOnOne.

**Platform navigation (mandatory):** Read [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc). Embed peers: **`FeaturePage`** + scroll on **`PlatformEmbedShell` `<main>`** (whole page, not inner lists). Satellites use auth-code redirect for cross-service hops. Multi-section **details / profile** pages: [details-page-cards.mdc](../../rules/details-page-cards.mdc) · [details-page-cards skill](../details-page-cards/SKILL.md).

**Core-hosted dialogs:** If an embedded peer needs a dialog to dim/cover the whole WebOnOne shell, follow [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc):

- **Media picker/crop** → `media-dialog-*` + `PlatformMediaDialogHost` (Media agent + WebOnOne).
- **Peer form/CRUD dialogs** → `peer-dialog-*` + `PlatformPeerDialogHost`: host owns **sizes + header + footer**; peer owns `/embed/dialogs/…` **body only** (`useRequestPlatformPeerDialog` / `usePlatformPeerDialogSubmit`). New dialogs are **peer-only** (no WebOnOne change). Also see [dialog-windows.mdc](../../rules/dialog-windows.mdc).

Delegate: peer FE agent for the form + route; webonone-agent only if changing the one-time host.

## Prompt templates

### Identity

```text
You are the Identity service agent for webonone-platform.

Scope: ONLY files under identity/.
Read: .cursor/agents/identity-agent.md and .cursor/skills/identity-agent/SKILL.md

Task: [USER TASK]

Constraints:
- Do not edit ui-kit/ or webonone-v2/
- Verify: npm run type-check -w identity-root

Return: summary, files touched, verification results, cross-service follow-ups.
```

### UI Kit

```text
You are the UI Kit agent for webonone-platform.

Scope: ONLY files under ui-kit/.
Read: .cursor/agents/ui-kit-agent.md and .cursor/skills/ui-kit-agent/SKILL.md

Task: [USER TASK]

Constraints:
- Do not edit identity/ or webonone-v2/
- Verify: npm run build -w @webonone/ui-kit && npm run type-check -w ui-kit-root

Return: summary, files touched, verification results, consumer impact if any.
```

### WebOnOne v2

```text
You are the WebOnOne v2 service agent for webonone-platform.

Scope: ONLY files under webonone-v2/.
Read: .cursor/agents/webonone-agent.md and .cursor/skills/webonone-agent/SKILL.md

Task: [USER TASK]

Constraints:
- Do not edit identity/ or ui-kit/
- Verify: npm run type-check -w webonone-v2-root

Return: summary, files touched, verification results, Identity follow-ups if any.
```

## Step 4 — Merge and verify

1. Collect subagent summaries.
2. Resolve conflicts on shared cross-service contracts.
3. Run repo- or service-level verification when appropriate.
4. Report to user.

## Do not

- Edit multiple service roots in the parent when one subagent suffices.
- Let a subagent change files outside its allowed prefix.
- Break [microservice-architecture.mdc](../../rules/microservice-architecture.mdc).
