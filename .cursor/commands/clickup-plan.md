# ClickUp → Implementation plan workflow

Create or update `spec/{SpecNo}/plan.mdc` from a **`[User Story]`** parent in **speced** status, commit, push on branch `spec/{SpecNo}`, and mark the parent plus **all subtasks** **`Planed`**.

Run the full workflow end-to-end in **Agent mode** without asking for confirmation unless blocked.

## Permissions — auto-run

Invoking this command **pre-authorizes** ClickUp MCP, git (checkout/pull/add/commit/push on `spec/{SpecNo}`), and `plan.mdc` writes. Execute immediately; do not wait for Run/Approve prompts. Requires Run Mode **Allowlist** or **Run Everything** — see [`.cursor/permissions.json`](.cursor/permissions.json). When part of `/clickup-run`, do not re-pick the task or ask to continue.

## Agent mode only — complete workflow in one pass

Stay in **Agent mode** for the entire workflow. Do **not** switch to Plan mode.

| Forbidden | Required |
|-----------|----------|
| `SwitchMode` to `plan` | Read spec + ClickUp, then write/update `plan.mdc`, commit, push, ClickUp |
| `CreatePlan` (Cursor in-chat plan UI) | Save deliverable to `spec/{SpecNo}/plan.mdc` on disk |
| Edit service source (`identity/`, `webonone-v2/`, `media/`, `ui-kit/`, `packages/*`) | Edit only `spec/{SpecNo}/plan.mdc` (and optional `README.md` link) |
| `npm run build`, `npm run dev`, type-check, lint, tests | List verification commands in the plan for **future** implementation |

**Sequence (all in Agent mode, same session):**

1. ClickUp — find **`[User Story]`** parent in **speced** status, parse Spec No, read all subtasks
2. Git — checkout `spec/{SpecNo}`, pull
3. Read — all docs under `spec/{SpecNo}/` plus relevant `.cursor/rules/` and `AGENTS.md`
4. Write or update — `spec/{SpecNo}/plan.mdc` (create or merge spec deltas)
5. Commit — `planed competed` (create) or `plan updated` (update)
6. Push — `origin spec/{SpecNo}`
7. ClickUp — set parent + **every subtask** to **Planed** only after push succeeds

Do not stop after drafting — continue through save, commit, push, and ClickUp in the same run.

## Planning only — not implementation

`/clickup-plan` produces or updates a **plan document** (`plan.mdc`). It does **not** implement features or run builds.

## ClickUp (MCP: ClickUp)

1. **Space:** `webonone_v2` (resolve via `clickup_get_workspace_hierarchy`).
2. **Find parent tasks:**
   - `clickup_search` with `keywords: "[User Story]"`, `filters.asset_types: ["task"]`, `filters.location.projects: [<space_id>]`, paginate; post-filter name prefix `[User Story]`.
   - Cross-check: `clickup_filter_tasks` with `space_ids`, `statuses: ["speced"]`, `include_closed: false`, `subtasks: false`.
   - Keep tasks whose **name starts with** `[User Story]` and status is **`speced`**.
3. **Pick task:**
   - If the user named a task id, url, or Spec No in chat, use that task.
   - Else prefer `[User Story]` **speced** tasks where `plan.mdc` is missing (lowest Spec No first).
   - Else prefer tasks where spec has deltas vs `plan.mdc` traceability (lowest Spec No first).
   - Else first open `[User Story]` **speced** task by lowest Spec No.
   - If zero matches, stop with a clear message.
4. **Read parent task:** `clickup_get_task` with `include: ["description", "subtasks"]` and `expand_statuses: true`.
   - Parse **Spec No** from parent description: `Spec No: X.Y.Z`. If missing, stop.
   - Confirm `spec/{SpecNo}/` exists. If not, stop — run `/clickup-spec` first.
   - Collect **all** subtask ids for batch status updates.
5. **After success only:** Batch-update parent + **every subtask id** to **`Planed`**. Do not change status if git steps fail.

## Create or update mode

| Mode | Condition | Commit message |
|------|-----------|----------------|
| **Create** | `spec/{SpecNo}/plan.mdc` missing | `planed competed` |
| **Update** | `plan.mdc` exists but spec has new/changed content vs plan | `plan updated` |
| **No-op** | plan traceability matches current spec | no commit |

### Spec delta detection (update mode)

Compare:

- Subtask rows in spec `README.md` **ClickUp traceability** and `07-implementation-plan.md` **ClickUp subtask traceability**
- Subtask rows in `plan.mdc` **ClickUp traceability** section
- New numbered spec docs or phases in `07-implementation-plan.md` not reflected in plan phases

**Update rules:**

- Incremental edits — add phases/tasks for new subtasks; refresh affected phases when spec changed.
- Do not rewrite entire plan unless user asked to replan.
- Read **all** `spec/{SpecNo}/` docs before writing.

## Git branch and folder

| Item | Value |
|------|--------|
| Spec folder | `spec/{SpecNo}/` |
| Plan file | `spec/{SpecNo}/plan.mdc` |
| Branch name | `spec/{SpecNo}` |

```bash
git checkout spec/{SpecNo}
git pull origin spec/{SpecNo}
```

If branch missing locally: `git fetch origin spec/{SpecNo}` and check out. If remote missing, stop — run `/clickup-spec` first.

## Read the spec package

Before writing the plan, read **all** docs under `spec/{SpecNo}/`, especially:

| Doc | Use for plan |
|-----|----------------|
| `README.md` | Scope, projects affected, doc index, ClickUp traceability |
| `01-overview.md` | Goals, in/out scope, success criteria |
| `07-implementation-plan.md` | Phases, branch workflow, acceptance checklist, subtask traceability |
| Numbered domain docs | Requirements, APIs, integration boundaries |

Also read relevant `.cursor/rules/` and `AGENTS.md`.

Map **every** subtask from spec traceability to a plan phase or task.

## Write `spec/{SpecNo}/plan.mdc`

### Frontmatter

```yaml
---
description: Implementation plan for spec {SpecNo} — {short title from README or ClickUp task}
alwaysApply: false
globs: {comma-separated globs for affected service roots}
---
```

Set `globs` from the spec **Projects affected** table.

### Body sections (required)

1. **Summary** — What this spec delivers; services/packages touched.
2. **Branch and prerequisites** — Branch `spec/{SpecNo}`; package builds; env/migration notes.
3. **Phases** — Aligned with `07-implementation-plan.md`. Each phase: goal, exit criteria, concrete tasks, paths, verify commands.
4. **Cross-service integration** — iframe/postMessage/JWT/events where required.
5. **ClickUp traceability** — Parent + **one row per subtask** → phase.
6. **Risks and open items**
7. **Final verification** — Commands for future implementation (list only; do not execute here).

### Content rules

- Actionable phase-by-phase; respect `microservice-architecture.mdc`.
- Point to numbered spec docs with relative links; do not duplicate entire spec prose.
- Target **under ~200 lines** when possible.

## Save, commit, and push

**Create:**

```bash
git add spec/{SpecNo}/plan.mdc
git commit -m "$(cat <<'EOF'
planed competed
EOF
)"
git push origin spec/{SpecNo}
```

**Update:**

```bash
git add spec/{SpecNo}/plan.mdc
git commit -m "$(cat <<'EOF'
plan updated
EOF
)"
git push origin spec/{SpecNo}
```

Optionally link `plan.mdc` in `README.md` **Documents** if missing.

## ClickUp status — Planed batch

After push succeeds:

- `clickup_update_task` → parent → **`Planed`**
- `clickup_update_task` → **each** subtask id → **`Planed`**

Use exact status strings from `expand_statuses` if needed.

If no commit (already in sync), skip push and status updates.

## Finish report

Reply with:

1. Mode: **created**, **updated**, or **already in sync**
2. ClickUp parent name and url
3. Spec No and branch pushed (if committed)
4. Path to `spec/{SpecNo}/plan.mdc`; phase count; new phases added (if update)
5. Parent + N subtasks → **Planed**, or why statuses were not changed

If any step fails, report what completed and what did not. Do **not** set ClickUp to **Planed** unless commit and push succeeded.
