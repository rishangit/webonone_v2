# ClickUp → Spec workflow

Create or update a versioned spec from a **`[User Story]`** parent task in the **webonone_v2** space, sync **every subtask** into `spec/{SpecNo}/`, commit, push, and mark the parent plus **all subtasks** **`speced`** when fully synced.

Run the full workflow end-to-end without asking for confirmation unless blocked.

## Permissions — auto-run

Invoking this command **pre-authorizes** ClickUp MCP, git (checkout/pull/add/commit/push on `spec/{SpecNo}`), and spec file writes. Execute immediately; do not wait for Run/Approve prompts. Requires Run Mode **Allowlist** or **Run Everything** — see [`.cursor/permissions.json`](.cursor/permissions.json). When part of `/clickup-run`, do not re-pick the task or ask to continue.

**Sequence (same session, do not skip subtask reads):**

1. ClickUp — find **`[User Story]`** parent, read parent, parse Spec No
2. ClickUp — fetch **every** subtask description individually; build full inventory
3. Git — create or update on branch `spec/{SpecNo}`
4. Read — prior spec under `spec/` for style and numbering (create); existing `spec/{SpecNo}/` (update)
5. Write — create full package or merge subtask deltas into `spec/{SpecNo}/`
6. Commit — `spec created` (create) or `space updated` (update)
7. Push — `git push -u origin spec/{SpecNo}` (create) or `git push origin spec/{SpecNo}` (update)
8. ClickUp — set parent + **every subtask** to **`speced`** only after push succeeds **and** spec fully reflects the inventory

## ClickUp (MCP: ClickUp)

1. **Space:** `webonone_v2` (resolve via `clickup_get_workspace_hierarchy`).
2. **Find parent tasks:**
   - `clickup_search` with `keywords: "[User Story]"`, `filters.asset_types: ["task"]`, `filters.location.projects: [<space_id>]`, paginate until exhausted.
   - Keep only tasks whose **name starts with** `[User Story]` and are **parents** (exclude subtask hits where `hierarchy.task` points to a different parent).
   - Optionally merge with `clickup_filter_tasks` (`space_ids`, `include_closed: false`, `subtasks: false`); dedupe by task id.
3. **Pick task:**
   - If the user named a task id, url, or Spec No in chat, use that task.
   - Else prefer open `[User Story]` tasks whose `spec/{SpecNo}/` is **missing** (lowest semver first).
   - Else prefer tasks with **subtask deltas** vs existing spec traceability (lowest semver first).
   - Else first open `[User Story]` task by lowest Spec No.
   - If zero matches, stop with a clear message.
4. **Read parent task:** `clickup_get_task` with `include: ["description", "subtasks"]` and `expand_statuses: true`.
5. **Parse Spec No:** From the parent description, extract `Spec No: X.Y.Z` (semver triplet). If missing, stop — description must contain `Spec No: X.Y.Z`.
6. **Read all subtasks (required before writing spec):**
   - Collect **every** subtask id from the parent `subtasks` array.
   - Do **not** skip closed, completed, or categorized subtasks unless the parent description explicitly excludes them by id/name.
   - For **each** id, call `clickup_get_task` with `include: ["description"]`. Parent subtask summaries lack full text — individual fetches are mandatory.
   - If any fetch fails, stop and report which id failed; do not write a partial spec.
   - Build inventory: `{ id, name, status, description }` for **all** subtasks.

## Create or update mode

| Mode | Condition | Git branch workflow | Commit message |
|------|-----------|---------------------|----------------|
| **Create** | `spec/{SpecNo}/` missing in repo | `git checkout master` → pull → `git checkout -b spec/{SpecNo}` (or checkout if branch exists) | `spec created` |
| **Update** | `spec/{SpecNo}/` exists + subtask deltas | `git checkout spec/{SpecNo}` → pull | `space updated` |
| **No-op** | All subtasks in traceability with matching descriptions | — | no commit |

If branch `spec/{SpecNo}` already exists locally, check it out instead of creating a duplicate.

### Detect subtask deltas (update mode)

Compare full ClickUp inventory against:

- `## ClickUp traceability` in `spec/{SpecNo}/README.md`
- `## ClickUp subtask traceability` in `spec/{SpecNo}/07-implementation-plan.md`

A subtask needs a spec update when **any** of:

1. **New** — id/name not in traceability tables
2. **Changed** — same name but description differs from spec body
3. **Renamed** — id matches but name changed

Process **all** deltas in one pass. Refinement / issue / bug name keywords only choose **where** to merge:

| Category | Name signal (case-insensitive) | Target |
|----------|-------------------------------|--------|
| refinement | `[Spec Refinement]` or contains `refinement` | `01-overview.md`, `README.md` “What changed”, or matching numbered doc |
| issue | `[Issue]` or contains `issue` | `07-implementation-plan.md` — phase or **Open items** |
| bug | `[Bug]` or contains `bug` | `07-implementation-plan.md` — **Fixes required** + acceptance checklist |
| default | all other subtasks | numbered domain doc + phase row |

**Update content rules:**

- Incremental edits only — do not rewrite entire docs.
- After update, traceability tables must list **every** subtask (full inventory).
- Add a **Revision history** bullet in `README.md` when deltas alter scope or acceptance.
- Latest subtask description wins over stale spec text.

## Write the spec

**Create mode:** Turn parent description + **every** subtask description into a full spec package.

**Update mode:** Merge delta subtasks only; preserve existing prose for unchanged subtasks.

Use prior specs as style references — highest `spec/X.Y.Z/` with version **less than** `{SpecNo}`.

### Source material order

1. **Parent task description** — vision, Spec No, cross-cutting scope.
2. **All subtask descriptions** — each must appear in spec body and traceability. Nothing dropped silently.

### Mapping subtasks to spec docs

| Subtask content | Target |
|-----------------|--------|
| Cross-cutting goals, glossary, in/out scope | `01-overview.md` |
| One subtask = one domain | Dedicated numbered doc named from subtask title |
| Multiple small subtasks in same service | One numbered doc with `##` per subtask |
| Delivery order, phases, acceptance | `07-implementation-plan.md` |
| Index and traceability | `README.md` — **Documents** + **ClickUp traceability** |

### Required files

| File | Purpose |
|------|---------|
| `README.md` | Index, what changed, projects affected, documents, **ClickUp traceability** (one row per subtask), inherited docs, rules, local dev |
| `01-overview.md` | Vision, goals, scope, glossary, success criteria |
| `07-implementation-plan.md` | Phases, branch workflow, acceptance checklist, **ClickUp subtask traceability** |

Add numbered docs (`02-*`, `03-*`, …) when subtasks or parent touch those areas.

### Content rules

- Expand ClickUp bullets into implementable requirements; preserve intent.
- Map features to microservices (`identity/`, `webonone-v2/`, `media/`, `ui-kit/`, `packages/*`).
- Respect `microservice-architecture.mdc`.
- Cross-link prior spec docs instead of duplicating baseline content.

## Commit and push

**Create:**

```bash
git add spec/{SpecNo}/
git commit -m "spec created"
git push -u origin spec/{SpecNo}
```

**Update:**

```bash
git add spec/{SpecNo}/
git commit -m "space updated"
git push origin spec/{SpecNo}
```

Use single-line `git commit -m "..."` only — no bash HEREDOC or PowerShell here-strings (`@' ... '@`). Cursor allowlist misparses here-strings as separate commands on Windows.

## ClickUp status — speced gate

Set statuses **only after** push succeeds **and** the spec fully reflects the inventory:

1. **Every** subtask in ClickUp appears in traceability tables.
2. **Every** subtask description is captured in the spec body (not just the table row).

Then batch-update via `clickup_update_task`:

- Parent → **`speced`**
- **Each** subtask id → **`speced`**

Use exact status strings from `expand_statuses` if needed.

If deltas remain after the write (partial sync), commit spec changes if any but **do not** change ClickUp statuses — report remaining deltas.

If no commit (already in sync), skip push and status updates.

## Finish report

Reply with:

1. Mode: **created**, **updated**, or **already in sync** (or **partial sync** if deltas remain)
2. ClickUp parent name and url
3. Spec No and branch pushed (if committed)
4. Subtask inventory: total count; deltas merged (name → doc/phase; new vs changed)
5. Files created or changed under `spec/{SpecNo}/`
6. ClickUp status: parent + N subtasks → **speced**, or why statuses were not changed

If any step fails, report what completed and what did not. Do **not** set ClickUp to **speced** unless push succeeded and the full-sync gate passed.
