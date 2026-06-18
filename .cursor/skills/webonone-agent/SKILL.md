---
name: webonone-agent
description: >-
  WebOnOne v2 service agent for webonone-platform. Handles webonone-v2/ frontend,
  backend, migrations — iframe login host, JWT verification, product shell. Use
  when tasks touch webonone-v2/, postMessage consumer, or webonone_db.
---

# WebOnOne v2 service agent

**Subagent:** [.cursor/agents/webonone-agent.md](../../agents/webonone-agent.md)

## Scope

**Allowed paths:** `webonone-v2/` only.

**Do not edit:** `identity/`, `ui-kit/` (except noting consumer updates to parent).

## Rules

- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports
- [nodejs-express.mdc](../../rules/nodejs-express.mdc) — Express/JWT
- [webonone-v2-project.mdc](../../rules/webonone-v2-project.mdc) — service globs
- [microservice-architecture.mdc](../../rules/microservice-architecture.mdc) — boundaries

## Verification

From repo root:

```bash
npm run type-check -w webonone-v2-root
```

From `webonone-v2/`:

```bash
npm run migrate
npm run dev
```

Login flow manual check: Identity must be running (`npm run dev:identity`).

## Return format

Summarize: files changed, verification results, and whether Identity needs a coordinated change.
