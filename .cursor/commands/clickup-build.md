# ClickUp → Build workflow

Implement development from a **`[User Story]`** parent in **Planed** status: read `spec/{SpecNo}/plan.mdc`, set parent + **all subtasks** **inprogress**, execute all phases, commit, push, and mark parent + **all subtasks** **developed**.

Run the full workflow end-to-end in **Agent mode** without asking for confirmation unless blocked.

## Permissions — auto-run

Invoking this command **pre-authorizes** ClickUp MCP, git (checkout/pull/add/commit/push), service source edits per `plan.mdc`, and all **Final verification** shell commands (`npm`, `pnpm`, `npx`, `node`). Execute immediately; do not wait for Run/Approve prompts. Requires Run Mode **Allowlist** or **Run Everything** — see [`.cursor/permissions.json`](.cursor/permissions.json). When part of `/clickup-run`, do not re-pick the task or ask to continue.

## Agent mode only — complete workflow in one pass

Stay in **Agent mode** for the entire workflow. Do **not** switch to Plan mode.

| Forbidden | Required |
|-----------|----------|
| `SwitchMode` to `plan` | Read plan + spec, implement phases, verify, commit, push, ClickUp |
| `CreatePlan` (Cursor in-chat plan UI) | Follow `spec/{SpecNo}/plan.mdc` on disk |
| Edit `spec/{SpecNo}/plan.mdc` unless fixing a factual error blocking work | Edit service source per plan phases |
| Stop after setting ClickUp to **inprogress** | Continue through implementation, verification, commit, push, **developed** |

**Sequence (all in Agent mode, same session):**

1. ClickUp — find **`[User Story]`** **Planed** parent, parse Spec No, read all subtasks
2. Git — checkout `spec/{SpecNo}`, pull
3. ClickUp — set parent + **every subtask** to **inprogress** (before coding)
4. Read — `plan.mdc`, spec docs, rules, `AGENTS.md`
5. **Build** — implement every phase in `plan.mdc`
6. **Verify** — run **Final verification** from `plan.mdc`
7. **Commit** — message exactly `development completed`
8. **Push** — `origin spec/{SpecNo}`
9. ClickUp — set parent + **every subtask** to **developed** only after push succeeds

Do not stop after step 3 — continue through build, verify, commit, push, and ClickUp in the same run.

## Build — not planning

`/clickup-build` **implements** the plan. It does **not** create or rewrite `plan.mdc`. If `plan.mdc` is missing, stop — run `/clickup-plan` first.

## ClickUp (MCP: ClickUp)

1. **Space:** `webonone_v2` (resolve via workspace hierarchy).
2. **Find parent tasks:**
   - `clickup_search` with `keywords: "[User Story]"`, `filters.asset_types: ["task"]`, `filters.location.projects: [<space_id>]`, paginate; post-filter name prefix.
   - Cross-check: `clickup_filter_tasks` with `space_ids`, `statuses: ["Planed"]`, `include_closed: false`, `subtasks: false`.
   - Keep tasks whose **name starts with** `[User Story]` and status is **`Planed`**.
3. **Pick task:**
   - If the user named a task id, url, or Spec No in chat, use that task.
   - Else first open `[User Story]` **Planed** task by lowest Spec No.
   - If zero matches, stop with a clear message.
4. **Read parent task:** `clickup_get_task` with `include: ["description", "subtasks"]` and `expand_statuses: true`.
   - Parse **Spec No** from parent description. If missing, stop.
   - Confirm `spec/{SpecNo}/plan.mdc` exists. If not, stop — run `/clickup-plan` first.
   - Collect **all** subtask ids for batch status updates.
5. **Start build:** After git checkout/pull succeeds, batch-update parent + **every subtask id** to **`inprogress`** before writing code. Use exact status from `expand_statuses` if `inprogress` fails (e.g. `in progress`).
6. **After success only:** Batch-update parent + **every subtask id** to **`developed`**. Do not change status if git steps fail.

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

If branch missing: `git fetch origin spec/{SpecNo}`. If remote missing, stop — run `/clickup-spec` and `/clickup-plan` first.

## Read the plan and spec

| Source | Use for build |
|--------|----------------|
| `spec/{SpecNo}/plan.mdc` | **Primary** — phases, paths, exit criteria, verification |
| `spec/{SpecNo}/README.md` | Scope, projects affected |
| Numbered spec docs | Requirements when plan references them |
| `plan.mdc` frontmatter `globs` | Scope guard |
| `.cursor/rules/`, `AGENTS.md` | Architecture and delegation |

Use **ClickUp traceability** in `plan.mdc` — one row per subtask — as completion anchors.

## Implement phases

Work **phase by phase** in order. For each phase:

1. Complete every task in the phase table.
2. Meet **exit criteria** before the next phase.
3. Run phase **Verify** commands when listed.
4. Respect `microservice-architecture.mdc`.

### Delegation

When multiple service roots are in scope, read `.cursor/skills/platform-orchestrator/SKILL.md` and delegate per routing table.

### Code rules

- Match existing patterns; use `@/` aliases per `code-cleanliness.mdc`.
- Chain package builds before consumer prod builds.
- Remove unused imports in touched files.
- Do not edit `plan.mdc` except blocking factual fixes (note in finish report).

## Verify

Run **Final verification** from `plan.mdc` before commit. Fix failures before committing.

## Commit and push

```bash
git add -A
git commit -m "$(cat <<'EOF'
development completed
EOF
)"
git push origin spec/{SpecNo}
```

Stage only implementation files when unrelated local changes exist.

## ClickUp status batches

| When | Parent + every subtask |
|------|------------------------|
| Build start (after git ready) | **`inprogress`** |
| Build success (after push) | **`developed`** |
| Build failure | leave **`inprogress`**, report blocker |

## Finish report

Reply with:

1. ClickUp parent name and url
2. Spec No and branch pushed
3. Phases completed (list)
4. Services/packages changed
5. Verification commands run and results
6. Parent + N subtasks → **developed** (or **inprogress** on failure)

Do **not** set ClickUp to **developed** unless commit and push succeeded.
