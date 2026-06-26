---
name: clickup-spec-update
description: Updates existing spec docs from ClickUp speced task comments only (not subtasks) in webonone_v2 space, commits on spec/X.Y.Z branch, and pushes. Subtask/spec deltas use /clickup-spec. Use when the user runs /clickup-spec-update.
disable-model-invocation: true
---

# ClickUp Spec Update Workflow

Invoked by `/clickup-spec-update` or explicit user request. Follow `.cursor/commands/clickup-spec-update.md` as the source of truth.

**Not in scope:** new/changed subtasks or spec traceability sync — use `/clickup-spec`.

## ClickUp constants

| Key | Value |
|-----|--------|
| Space name | `webonone_v2` |
| Source status | `speced` |
| Spec No pattern | `Spec No: X.Y.Z` in parent task description |

## MCP tools (ClickUp server)

| Step | Tool |
|------|------|
| Resolve space | `clickup_get_workspace_hierarchy` |
| List speced tasks | `clickup_filter_tasks` with `space_ids` + `statuses: ["speced"]` |
| Read parent task | `clickup_get_task` with `include: ["description", "subtasks"]` |
| Parent comments | `clickup_get_task_comments` with parent task id |
| Threaded replies | `clickup_get_threaded_comments` when `reply_count > 0` |
| Subtask comments | Repeat comments + threaded replies for each subtask id |

## Prerequisite

`spec/{SpecNo}/` must already exist (created by `/clickup-spec`). Remote branch `spec/{SpecNo}` must exist.

## Update rules

- Read existing spec files before editing.
- Map parent comments → overview / README; subtask comments → matching numbered doc.
- Incremental merge — do not replace entire docs unless comments require it.
- Note scope or acceptance changes in `README.md` or `07-implementation-plan.md`.
- Latest comment wins on direct contradictions.

## Git guardrails

- Branch: `spec/{SpecNo}` (checkout + pull)
- Commit message exactly: `space updated`
- Push: `git push origin spec/{SpecNo}`
- Do not change ClickUp task status
