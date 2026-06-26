---
name: clickup-build
description: Implements development from ClickUp [User Story] Planed tasks — reads plan.mdc, sets parent + all subtasks inprogress, builds all phases, commits development completed, pushes, sets parent + all subtasks developed. Use when the user runs /clickup-build.
disable-model-invocation: true
---

# ClickUp Build Workflow

Invoked by `/clickup-build` or explicit user request. Follow `.cursor/commands/clickup-build.md` as the source of truth.

## Agent mode only

Stay in **Agent mode**. Do **not** call `SwitchMode` or `CreatePlan`. Do **not** stop after **inprogress**.

## ClickUp constants

| Key | Value |
|-----|--------|
| Space name | `webonone_v2` |
| Parent name prefix | `[User Story]` |
| Source status | `Planed` |
| Start status | `inprogress` (parent + every subtask) |
| Target status | `developed` (parent + every subtask) |
| Spec No pattern | `Spec No: X.Y.Z` in parent description |

If status update fails, re-fetch with `expand_statuses: true` for exact strings.

## MCP tools (ClickUp server)

| Step | Tool |
|------|------|
| Resolve space | `clickup_get_workspace_hierarchy` |
| Find [User Story] Planed | `clickup_search` + post-filter; `clickup_filter_tasks` with `statuses: ["Planed"]` |
| Read parent task | `clickup_get_task` with `include: ["description", "subtasks"]`, `expand_statuses: true` |
| Batch inprogress | For parent + **each** subtask id: `clickup_update_task` — after git ready, before coding |
| Batch developed | For parent + **each** subtask id: `clickup_update_task` — after push succeeds |

## Prerequisites

- `spec/{SpecNo}/plan.mdc` exists (from `/clickup-plan`).
- Remote branch `spec/{SpecNo}` checked out.

## Workflow steps (Agent mode, end-to-end)

1. ClickUp — find **`[User Story]`** **Planed** task, parse Spec No, collect all subtask ids.
2. Git — checkout + pull `spec/{SpecNo}`.
3. Parent + **all** subtasks → **inprogress**.
4. Read `plan.mdc`, spec, rules, `AGENTS.md`.
5. Implement every phase; delegate multi-service via `platform-orchestrator`.
6. Run **Final verification** from `plan.mdc`.
7. Commit `development completed` + push.
8. Parent + **all** subtasks → **developed**.

## Phase execution checklist

Per phase: all tasks done · exit criteria met · verify commands run · no boundary violations

## Delegation (multi-service)

| Path prefix | Agent skill |
|-------------|-------------|
| `identity/` | `identity-agent` |
| `ui-kit/` | `ui-kit-agent` |
| `webonone-v2/` | `webonone-agent` |
| `media/`, `packages/media-embed/` | `media-agent` |

## Git guardrails

- Branch: `spec/{SpecNo}`
- Commit: `development completed`
- Push: `git push origin spec/{SpecNo}`
- On failure: leave parent + subtasks **inprogress**

## Status flow

```text
Planed → inprogress (parent + all subtasks) → developed (parent + all subtasks)
```

Prior commands:

| Command | Status transition |
|---------|-------------------|
| `/clickup-spec` | → speced (parent + all subtasks) |
| `/clickup-plan` | → Planed (parent + all subtasks) |
| `/clickup-build` | → inprogress → developed (parent + all subtasks) |

## Finish report

Parent url · Spec No · phases done · services changed · verification · parent + N subtasks → developed
