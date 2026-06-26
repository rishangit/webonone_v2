# ClickUp → Full pipeline workflow

Run the full ClickUp delivery pipeline **continuously in one session**, with **no questions** and **no confirmation prompts**:

1. `/clickup-spec`
2. `/clickup-plan`
3. `/clickup-build`

Start Step 2 immediately when Step 1 succeeds. Start Step 3 immediately when Step 2 succeeds. Do not pause between steps. Do not ask the user to confirm the next step.

Run the full workflow end-to-end without asking for confirmation unless a step is **hard-blocked** (e.g. missing `Spec No`, git push failure, MCP error).

## Agent mode only — one continuous pass

Stay in **Agent mode** for the entire run. Complete all three commands in the **same session**.

| Forbidden | Required |
|-----------|----------|
| Asking the user which task to use (when one can be resolved) | Auto-pick task and proceed |
| Asking to continue after spec or plan succeeds | Continue automatically to the next step |
| `SwitchMode` to `plan` | Stay in Agent mode through spec, plan, and build |
| `CreatePlan` (Cursor in-chat plan UI) | Follow command files on disk only |
| Stopping after a successful earlier step | Run spec → plan → build back-to-back |
| Running steps out of order | Strict order: spec → plan → build |

## Task selection — no questions

Resolve the **`[User Story]`** parent **without asking the user**:

1. If the user named a task id, url, or Spec No in chat, use that task.
2. Else find open tasks in `webonone_v2` whose **name starts with** `[User Story]` (via `clickup_search` + post-filter).
3. Pick the task with the lowest Spec No that needs work (missing spec → spec delta → missing plan → plan delta → Planed for build).
4. Use that task's **Spec No** and subtask inventory for all three steps — same parent through spec → plan → build.
5. Only stop (do not ask) if no `[User Story]` task exists, or `Spec No: X.Y.Z` is missing from the parent description.

Do not list tasks and ask which to pick. Do not ask "should I continue to plan/build?".

## Execution sequence

Carry **Spec No**, branch `spec/{SpecNo}`, parent task id, and **all subtask ids** from Step 1 through Steps 2 and 3.

### Step 1 — `/clickup-spec`

Follow `.cursor/commands/clickup-spec.md` exactly.

On success, **immediately** start Step 2 — no user prompt.

Success gate:

- Spec branch `spec/{SpecNo}` exists and is pushed (if committed)
- Spec files committed (`spec created` or `space updated`) when changes were needed
- Parent + **all subtasks** → **speced** (full-sync gate passed)

If Step 1 fails or ends in partial sync (spec committed but statuses not updated), stop and report. Do not start Step 2.

### Step 2 — `/clickup-plan`

Follow `.cursor/commands/clickup-plan.md` exactly for the **same** Spec No, parent, and subtasks.

On success, **immediately** start Step 3 — no user prompt.

Success gate:

- `spec/{SpecNo}/plan.mdc` created or updated, committed (`planed competed` or `plan updated`), and pushed (if committed)
- Parent + **all subtasks** → **Planed**

If Step 2 fails, stop and report. Do not start Step 3.

### Step 3 — `/clickup-build`

Follow `.cursor/commands/clickup-build.md` exactly for the **same** Spec No, parent, and subtasks.

Success gate:

- Parent + **all subtasks** → **inprogress** during build
- All phases in `plan.mdc` implemented
- Final verification commands passed
- Changes committed (`development completed`) and pushed
- Parent + **all subtasks** → **developed**

If Step 3 fails, stop and report blocker; leave parent + subtasks at **inprogress**.

## Status flow (end-to-end)

```text
ready → speced (parent + all subtasks) → Planed (parent + all subtasks) → inprogress (parent + all subtasks) → developed (parent + all subtasks)
```

Each command batch-updates the **parent** and **every subtask id** via `clickup_update_task`.

## Failure handling

- Do not continue if the current step failed.
- Do not set downstream ClickUp statuses when an upstream step has not succeeded.
- Report what finished and what remains — still **do not ask** follow-up questions unless the user must fix something outside the agent (e.g. ClickUp credentials).

## Finish report

Reply once at the end with:

1. Parent task name and url
2. Spec No and branch
3. Subtask count
4. Each stage: spec ✓ / plan ✓ / build ✓ (or which step failed)
5. Final ClickUp status on parent + subtasks (`developed` on full success)
