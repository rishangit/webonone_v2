---
name: clickup-plan
description: Creates or updates implementation plan.mdc from ClickUp [User Story] speced tasks (parent + all subtasks) in Agent mode, commits planed competed or plan updated, pushes, sets parent + all subtasks Planed. Use when the user runs /clickup-plan.
disable-model-invocation: true
---

# ClickUp Plan Workflow

Invoked by `/clickup-plan` or explicit user request. Follow `.cursor/commands/clickup-plan.md` as the source of truth.

**Auto-run:** ClickUp MCP, git, and `plan.mdc` writes are pre-authorized — execute without waiting for approval. See `.cursor/permissions.json`. When part of `/clickup-run`, do not re-pick the task or ask to continue.

## Agent mode only

Stay in **Agent mode**. Do **not** call `SwitchMode` or `CreatePlan`.

## ClickUp constants

| Key | Value |
|-----|--------|
| Space name | `webonone_v2` |
| Parent name prefix | `[User Story]` |
| Source status | `speced` |
| Target status | `Planed` (parent + every subtask) |
| Spec No pattern | `Spec No: X.Y.Z` in parent description |

## MCP tools (ClickUp server)

| Step | Tool |
|------|------|
| Resolve space | `clickup_get_workspace_hierarchy` |
| Find [User Story] speced | `clickup_search` + post-filter; `clickup_filter_tasks` with `statuses: ["speced"]` |
| Read parent task | `clickup_get_task` with `include: ["description", "subtasks"]`, `expand_statuses: true` |
| Batch Planed | For parent + **each** subtask id: `clickup_update_task` with `status: "Planed"` |

## Prerequisites

- `spec/{SpecNo}/` exists (from `/clickup-spec`).
- Remote branch `spec/{SpecNo}` exists.

## Create vs update

| Mode | Condition | Commit message |
|------|-----------|----------------|
| Create | `plan.mdc` missing | `planed competed` |
| Update | spec deltas vs plan traceability | `plan updated` |
| No-op | plan matches spec | no commit |

## Workflow steps (Agent mode, end-to-end)

1. ClickUp — find **`[User Story]`** **speced** task, parse Spec No, collect all subtask ids.
2. Git — `git checkout spec/{SpecNo}` + pull.
3. Read — all `spec/{SpecNo}/` docs, rules, `AGENTS.md`.
4. Write or update `plan.mdc` — traceability row per subtask.
5. Commit + push.
6. Parent + **all** subtasks → **Planed** after push.

## plan.mdc template

Required sections: Summary · Branch and prerequisites · Phases · Cross-service integration · **ClickUp traceability** (parent + every subtask) · Risks · Final verification

## Git guardrails

- Branch: `spec/{SpecNo}`
- Create commit: `planed competed`
- Update commit: `plan updated`
- Push: `git push origin spec/{SpecNo}`
- Batch ClickUp update only after successful push

## Finish report

Mode · parent url · Spec No · plan.mdc path · phases added · parent + N subtasks → Planed
