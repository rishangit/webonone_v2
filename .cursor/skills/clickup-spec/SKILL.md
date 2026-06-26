---
name: clickup-spec
description: Creates or updates versioned spec docs from ClickUp [User Story] tasks (parent + all subtasks) in webonone_v2, commits on spec/X.Y.Z branch, pushes, and sets parent + all subtasks to speced when fully synced. Use when the user runs /clickup-spec.
disable-model-invocation: true
---

# ClickUp Spec Workflow

Invoked by `/clickup-spec` or explicit user request. Follow `.cursor/commands/clickup-spec.md` as the source of truth.

Subtask/spec deltas → `/clickup-spec`. Comment-only feedback → `/clickup-spec-update`.

## ClickUp constants

| Key | Value |
|-----|--------|
| Space name | `webonone_v2` |
| Parent name prefix | `[User Story]` |
| Target status | `speced` (parent + every subtask) |
| Spec No pattern | `Spec No: X.Y.Z` in parent description |

## MCP tools (ClickUp server)

| Step | Tool |
|------|------|
| Resolve space | `clickup_get_workspace_hierarchy` |
| Find [User Story] parents | `clickup_search` with `keywords: "[User Story]"`, `filters.asset_types: ["task"]`, `filters.location.projects: [<space_id>]` — paginate; post-filter name prefix |
| Optional cross-check | `clickup_filter_tasks` with `space_ids`, `include_closed: false`, `subtasks: false` |
| Read parent task | `clickup_get_task` with `include: ["description", "subtasks"]`, `expand_statuses: true` |
| Read **every** subtask | For **each** subtask id: `clickup_get_task` with `include: ["description"]` |
| Batch status update | For parent id + **each** subtask id: `clickup_update_task` with `status: "speced"` — only after full-sync gate |

## Subtask workflow (before writing spec)

1. Fetch parent → parse `Spec No: X.Y.Z` → collect **all** subtask ids.
2. Fetch each subtask individually; build inventory `{ id, name, status, description }`.
3. **Create:** map every subtask to docs/phases; write full package.
4. **Update:** diff inventory vs traceability; merge all deltas incrementally.
5. Traceability tables in `README.md` and `07-implementation-plan.md` — **one row per subtask**.

Do not write spec files until every subtask description is loaded.

## Create vs update git

| Mode | Branch | Commit message | Push |
|------|--------|----------------|------|
| Create | `master` → `spec/{SpecNo}` | `spec created` | `git push -u origin spec/{SpecNo}` |
| Update | `spec/{SpecNo}` pull | `space updated` | `git push origin spec/{SpecNo}` |

## Speced gate

Update ClickUp **only when**:

- Push succeeded (or create/update had commits)
- Every subtask in inventory is in traceability **and** spec body

Then: parent + **all** subtask ids → `speced`.

Partial sync: commit if needed, **no** status changes, report remaining deltas.

## Spec package template

Mirror the latest prior spec under `spec/`. Minimum set:

### README.md skeleton

```markdown
# WebOnOne Platform — Specification ({SpecNo})

## ClickUp traceability

| ClickUp | Spec destination |
|---------|------------------|
| Parent: {task name} | `01-overview.md`, `README.md` |
| Subtask: {name} | `{numbered doc or phase}` |
```

### 07-implementation-plan.md

Branch workflow · **ClickUp subtask traceability** (one row per subtask) · Phases · Acceptance checklist

## Prior spec lookup

Highest `spec/X.Y.Z/` with version strictly less than `{SpecNo}`.

## Finish report

Mode · parent url · Spec No · subtask count + deltas · files changed · parent + N subtasks → speced (or partial-sync reason).
