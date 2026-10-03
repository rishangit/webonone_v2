---
name: feedback-fix
description: Support feedback queue via MCP — spec + plan under spec/{ticket}/, planned status, then implement to developed. Pick by /feedback-fix 0001 or queue. Use when the user runs /feedback-fix.
---

# Feedback fix workflow

Follow [`.cursor/commands/feedback-fix.md`](../commands/feedback-fix.md) as the source of truth.

**Standalone:** Support Feedback MCP only — no ClickUp. One report per invocation (ticket, id, or queue).

**Auto-run:** MCP, `SwitchMode` to `plan` for planning, `spec/{ticket}/` writes, git, implementation, verification — pre-authorized per `.cursor/permissions.json`.

## Status flow

| Status | Set by |
|--------|--------|
| `todo` | Default on create |
| `ready_to_develop` | Super admin |
| `planned` | `/feedback-fix` after `spec.md` + `plan.md` |
| `in_progress` | `/feedback-fix` when implementation starts |
| `developed` | `/feedback-fix` on verified completion |
| `staging`, `closed` | Super admin only |

## Ticket numbers

- Four digits, zero-padded (`0001`). Assigned on create; shown in Support UI and MCP `ticketNumber`.
- **`feedback_get`** accepts 21-char id **or** ticket string.
- User command: `/feedback-fix 0001` (normalize `1` → `0001`).

## Spec folder

| File | Purpose |
|------|---------|
| `spec/{ticketNumber}/spec.md` | Requirement from feedback title/description |
| `spec/{ticketNumber}/plan.md` | Implementation plan (written after Plan mode) |

## MCP tools

| Tool | Use |
|------|-----|
| `feedback_list` | Queue `ready_to_develop` / `planned`; optional `ticket`, `type`, `status` |
| `feedback_get` | Id or four-digit ticket |
| `feedback_update_status` | `planned` after spec+plan; `in_progress` before code; `developed` when done |

## Pick order (no user prompt)

1. User ticket (4 digits) or id → must be `ready_to_develop` or `planned`
2. Else oldest `ready_to_develop` (spec phase)
3. Else oldest `planned` (implement phase)
4. Optional bug/feature filter; tie-break `id`

## Phases

1. **`ready_to_develop`:** requirement → `spec.md` → Plan mode → `plan.md` → status `planned` → continue to implement in same session
2. **`planned`:** claim `in_progress` → code per spec/plan → verify → `developed`

## Verification

`npm run type-check` / `npm run lint` on touched workspaces before `developed`.
