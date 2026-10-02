---
name: feedback-fix
description: Implements bug fixes or small features from hosted Support feedback in ready_to_develop via MCP — claim in_progress, implement locally, developed on success. Super admin sets staging/closed in UI. Use when the user runs /feedback-fix.
---

# Feedback fix workflow

Invoked by `/feedback-fix` or explicit user request. Follow [`.cursor/commands/feedback-fix.md`](../commands/feedback-fix.md) as the source of truth.

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

## Scope guard

Large **feature** requests → stop after claim; direct user to `/clickup-spec`. Do not mark `developed`.

## Verification

`npm run type-check` / `npm run lint` on touched workspaces before `developed`.
