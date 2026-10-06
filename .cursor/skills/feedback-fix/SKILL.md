---
name: feedback-fix
description: Support feedback queue via MCP — spec, plan, development-summary under spec/{ticket}/, push deploy_staging, staging status. Pick by /feedback-fix 0001 or queue. Use when the user runs /feedback-fix.
---

# Feedback fix workflow

Follow [`.cursor/commands/feedback-fix.md`](../commands/feedback-fix.md) as the source of truth.

**Standalone:** Support Feedback MCP only. One report per invocation (ticket, id, or queue).

**Auto-run:** MCP, `SwitchMode` to `plan` (IDE only), `spec/{ticket}/` writes, git commit/push to **`deploy_staging`**, implementation, verification — pre-authorized per `.cursor/permissions.json`.

## Status flow

| Status | Set by |
|--------|--------|
| `todo` | Default on create |
| `ready_to_develop` | Super admin |
| `planned` | `/feedback-fix` after `spec.md` + `plan.md` |
| `in_progress` | `/feedback-fix` when implementation starts |
| `developed` | `/feedback-fix` when verified, before push |
| `staging` | `/feedback-fix` after successful push to `deploy_staging` |
| `closed` | Super admin only |

## Ticket numbers

- Four digits, zero-padded (`0001`). Assigned on create; shown in Support UI and MCP `ticketNumber`.
- **`feedback_get`** accepts 21-char id **or** ticket string.
- User command: `/feedback-fix 0001` (normalize `1` → `0001`).

## Spec folder

| File | Purpose |
|------|---------|
| `spec/{ticketNumber}/spec.md` | Requirement from feedback title/description |
| `spec/{ticketNumber}/plan.md` | Implementation plan |
| `spec/{ticketNumber}/development-summary.md` | Delivered feature, where to verify, deploy commit — [template](development-summary-template.md) |

## MCP tools

| Tool | Use |
|------|-----|
| `feedback_list` | Queue `ready_to_develop` / `planned`; optional `ticket`, `type`, `status` |
| `feedback_get` | Id or four-digit ticket |
| `feedback_update_status` | `planned`; `in_progress`; `developed`; `staging` after push |

## Pick order (no user prompt)

1. User ticket (4 digits) or id → must be `ready_to_develop` or `planned`
2. Else oldest `ready_to_develop` (spec phase)
3. Else oldest `planned` (implement phase)
4. Optional bug/feature filter; tie-break `id`

## Phases

1. **`ready_to_develop`:** requirement → `spec.md` → `plan.md` → status `planned` → continue in same session
2. **`planned`:** `in_progress` → implement → verify → `developed` → `development-summary.md` (including deploy detect) → **one** commit → push `deploy_staging` → `staging`

## Verification

`npm run type-check` / `npm run lint` on touched workspaces before `developed`.

## Deploy detection (before commit)

From repo root, before writing the final `development-summary.md` Deploy table:

```bash
npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print
```

1. Copy **mode**, **services**, and **reason** into the Deploy section ([template](development-summary-template.md)).
2. If `mode=none` but product code changed, fix paths or [`tooling/deploy-services.json`](../../tooling/deploy-services.json) mapping before push.
3. After push, the finish report must include GitHub Actions **Deploy summary** / **Deploy detect job summary** (`mode`, `reason`) to confirm prediction matched runtime — no second commit to update the md.

## Deploy branch

Push **`deploy_staging`** only ([tooling/CICD.md](../../tooling/CICD.md)). **Exactly one** single-line `git commit -m "feedback 0001: title"` on Windows, then one push. Put the short sha in the finish report only — never a follow-up commit that only updates `development-summary.md` Deploy sha (e.g. `record staging deploy commit`).
