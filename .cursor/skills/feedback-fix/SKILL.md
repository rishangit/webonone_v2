---
name: feedback-fix
description: Implements bug fixes or small features from hosted Support feedback in ready_to_develop via MCP — claim in_progress, implement locally, developed on success. Super admin sets staging/closed in UI. Use when the user runs /feedback-fix.
---

# Feedback fix workflow

Invoked by `/feedback-fix` or explicit user request. Follow [`.cursor/commands/feedback-fix.md`](../commands/feedback-fix.md) as the source of truth.

**Standalone:** Support Feedback MCP only — no ClickUp MCP, no `/clickup-spec`. Each `/feedback-fix` run is independent (one queue item per invocation).

**Auto-run:** Support Feedback MCP, git, implementation edits, and verification commands are pre-authorized — execute without waiting for approval. See `.cursor/permissions.json`.

## Status flow (automated vs manual)

| Status | Set by |
|--------|--------|
| `todo` | Default on create |
| `ready_to_develop` | Super admin |
| `in_progress` | `/feedback-fix` on start |
| `developed` | `/feedback-fix` on verified completion |
| `staging`, `closed` | Super admin only (not MCP) |

## MCP tools

| Tool | Use |
|------|-----|
| `feedback_list` | Queue with `status: ready_to_develop`; optional `type` filter |
| `feedback_get` | User-supplied id |
| `feedback_update_status` | Claim `in_progress`; finish `developed` |

Server env: `SUPPORT_API_BASE_URL` (staging/live), `SUPPORT_FEEDBACK_BEARER_TOKEN` (super_admin). See `tooling/support-feedback-mcp/README.md`.

## Pick order

1. User id → must be `ready_to_develop`
2. Else list all `ready_to_develop` (paginate)
3. Optional user filter: bug / feature
4. Oldest `createdAt`, tie-break `id`

## After claim — read title & description, develop requirement

1. **`feedback_get`** for the picked id.
2. Read **`title`**, **`description`**, **`type`**, and **`attachmentUrl`** (screenshot when needed).
3. Before code: restate the problem/goal, list acceptance criteria, name likely service roots, run scope guard.
4. Implement against that requirement; verify each criterion.

## Scope guard

Do **not** stop after claim without writing product code. For large **feature** descriptions, ship the **title** (MVP) in Support (or the owning service), then continue description items in the same session when they stay in **one or two service roots**. Mark **`developed`** when the title and shipped slices are verified. Leave **`in_progress`** only when blocked (not because the ticket is an epic). Optional: super admin splits follow-up reports for work deferred to another `/feedback-fix` run.

## Verification

`npm run type-check` / `npm run lint` on touched workspaces before `developed`.
