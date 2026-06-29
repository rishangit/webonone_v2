# ClickUp → Spec workflow

Create or update a versioned spec from a **`[User Story]`** parent task in the **webonone_v2** space, sync **ready** subtasks into `spec/{SpecNo}/`, commit, push, and mark the parent plus processed subtasks **`speced`** when fully synced.

Run the full workflow end-to-end without asking for confirmation unless blocked.

## Permissions — auto-run

Invoking this command **pre-authorizes** ClickUp MCP, git (checkout/pull/add/commit/push on `spec/{SpecNo}`), and spec file writes. Execute immediately; do not wait for Run/Approve prompts. Requires Run Mode **Allowlist** or **Run Everything** — see [`.cursor/permissions.json`](.cursor/permissions.json). When part of `/clickup-run`, do not re-pick the task or ask to continue.

**Sequence (same session):**

1. ClickUp — find **`[User Story]`** parent in **`ready`** status (or handle **developed** parent with **ready** subtasks — see below), read parent, parse Spec No
2. ClickUp — **developed** parent check: if parent is **`developed`** and any subtask is **`ready`**, set parent → **`inprogress`**, then continue
3. ClickUp — fetch **ready** subtask descriptions individually; skip **Deployed** and **TO DO** subtasks entirely
4. Git — create or update on branch `spec/{SpecNo}`
5. Read — prior spec under `spec/` for style and numbering (create); existing `spec/{SpecNo}/` (update)
6. Write — create full package or merge **ready** subtask deltas into `spec/{SpecNo}/`
7. Commit — `spec created` (create) or `space updated` (update)
8. Push — `git push -u origin spec/{SpecNo}` (create) or `git push origin spec/{SpecNo}` (update)
9. ClickUp — set parent + **each processed ready subtask** to **`speced`** only after push succeeds **and** spec fully reflects the ready inventory

## ClickUp status rules

| Status | Parent | Subtask |
|--------|--------|---------|
| **`ready`** | Eligible for create; primary pick target | **Read, sync, and delta-check** |
| **`Deployed`** | **Exclude** — do not pick or read | **Exclude** — do not fetch or read |
| **`TO DO`** | **Exclude** — do not pick or read | **Exclude** — do not fetch or read |
| **`developed`** | Not a pick target; if found with **ready** subtasks → revert parent to **`inprogress`**, then continue | N/A |
| Other (`speced`, `Planed`, `inprogress`, …) | Use only when user names task id/url/Spec No in chat | Delta-check **only** if subtask is **`ready`** |

Use exact status strings from `expand_statuses` when `clickup_update_task` fails (e.g. `in progress` vs `inprogress`).

### Developed parent + ready subtasks

Before reading subtask descriptions or writing spec:

1. If parent status is **`developed`**, scan parent `subtasks` summaries for any subtask with status **`ready`**.
2. If **any** ready subtask exists, `clickup_update_task` on the **parent only** → **`inprogress`**.
3. Continue the workflow — do not stop after the status change.

This signals downstream `/clickup-build` that new scope was specced after a prior build completed.

## ClickUp (MCP: ClickUp)

1. **Space:** `webonone_v2` (resolve via `clickup_get_workspace_hierarchy`).
2. **Find parent tasks:**
   - `clickup_search` with `keywords: "[User Story]"`, `filters.asset_types: ["task"]`, `filters.location.projects: [<space_id>]`, paginate until exhausted.
   - Cross-check: `clickup_filter_tasks` with `space_ids`, `statuses: ["ready"]`, `include_closed: false`, `subtasks: false`.
   - Keep only tasks whose **name starts with** `[User Story]`, are **parents**, and status is **`ready`**.
   - **Exclude** parents in **`Deployed`** or **`TO DO`** — do not pick, read, or process them.
3. **Pick task:**
   - If the user named a task id, url, or Spec No in chat, use that task (still apply subtask status filters below; still run **developed** parent check when applicable).
   - Else prefer open `[User Story]` **`ready`** tasks whose `spec/{SpecNo}/` is **missing** (lowest semver first).
   - Else prefer **`ready`** tasks with **ready** subtask deltas vs existing spec traceability (lowest semver first).
   - Else first open `[User Story]` **`ready`** task by lowest Spec No.
   - If zero matches, stop with a clear message.
4. **Read parent task:** `clickup_get_task` with `include: ["description", "subtasks"]` and `expand_statuses: true`.
5. **Parse Spec No:** From the parent description, extract `Spec No: X.Y.Z` (semver triplet). If missing, stop — description must contain `Spec No: X.Y.Z`.
6. **Developed parent check** (step 2 in sequence) — see section above.
7. **Read subtasks (required before writing spec):**
   - From parent `subtasks`, collect ids whose status is **`ready`** only.
   - **Do not** fetch or read subtasks in **`Deployed`** or **`TO DO`** — skip them entirely.
   - **Do not** fetch subtasks in other statuses for update delta checks (they may appear in existing traceability from prior syncs; leave unchanged unless user-named task forces a full re-read).
   - For **each** eligible **ready** id, call `clickup_get_task` with `include: ["description"]`. Parent subtask summaries lack full text — individual fetches are mandatory.
   - If any eligible fetch fails, stop and report which id failed; do not write a partial spec.
   - Build inventory: `{ id, name, status, description }` for **ready** subtasks only.

## Create or update mode

| Mode | Condition | Git branch workflow | Commit message |
|------|-----------|---------------------|----------------|
| **Create** | `spec/{SpecNo}/` missing in repo | `git checkout master` → pull → `git checkout -b spec/{SpecNo}` (or checkout if branch exists) | `spec created` |
| **Update** | `spec/{SpecNo}/` exists + **ready** subtask deltas | `git checkout spec/{SpecNo}` → pull | `space updated` |
| **No-op** | All **ready** subtasks in traceability with matching descriptions | — | no commit |

If branch `spec/{SpecNo}` already exists locally, check it out instead of creating a duplicate.

### Detect subtask deltas (update mode)

Compare **ready** subtask inventory only against:

- `## ClickUp traceability` in `spec/{SpecNo}/README.md`
- `## ClickUp subtask traceability` in `spec/{SpecNo}/07-implementation-plan.md`

**Only subtasks in `ready` status** participate in delta detection. Ignore **Deployed**, **TO DO**, and all other non-ready subtasks for update checks.

A **ready** subtask needs a spec update when **any** of:

1. **New** — id/name not in traceability tables
2. **Changed** — same name but description differs from spec body
3. **Renamed** — id matches but name changed

Process **all** ready deltas in one pass. Refinement / issue / bug name keywords only choose **where** to merge:

| Category | Name signal (case-insensitive) | Target |
|----------|-------------------------------|--------|
| refinement | `[Spec Refinement]` or contains `refinement` | `01-overview.md`, `README.md` “What changed”, or matching numbered doc |
| issue | `[Issue]` or contains `issue` | `07-implementation-plan.md` — phase or **Open items** |
| bug | `[Bug]` or contains `bug` | `07-implementation-plan.md` — **Fixes required** + acceptance checklist |
| default | all other subtasks | numbered domain doc + phase row |

**Update content rules:**

- Incremental edits only — do not rewrite entire docs.
- After update, traceability tables must list **every processed ready subtask** (ready inventory).
- Preserve traceability rows for subtasks not re-read (non-ready) unless a ready delta supersedes them.
- Add a **Revision history** bullet in `README.md` when deltas alter scope or acceptance.
- Latest subtask description wins over stale spec text.

## Write the spec

**Create mode:** Turn parent description + **every ready** subtask description into a full spec package.

**Update mode:** Merge **ready** delta subtasks only; preserve existing prose for unchanged subtasks.

Use prior specs as style references — highest `spec/X.Y.Z/` with version **less than** `{SpecNo}`.

### Source material order

1. **Parent task description** — vision, Spec No, cross-cutting scope.
2. **Ready subtask descriptions** — each must appear in spec body and traceability. Nothing dropped silently.

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
| `README.md` | Index, what changed, projects affected, documents, **ClickUp traceability** (one row per processed ready subtask), inherited docs, rules, local dev |
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

Set statuses **only after** push succeeds **and** the spec fully reflects the **ready** inventory:

1. **Every processed ready subtask** appears in traceability tables.
2. **Every processed ready subtask** description is captured in the spec body (not just the table row).

Then batch-update via `clickup_update_task`:

- Parent → **`speced`**
- **Each processed ready subtask** id → **`speced`**

Do **not** change status on **Deployed**, **TO DO**, or other non-ready subtasks.

If deltas remain after the write (partial sync), commit spec changes if any but **do not** change ClickUp statuses — report remaining deltas.

If no commit (already in sync), skip push and status updates.

## Finish report

Reply with:

1. Mode: **created**, **updated**, or **already in sync** (or **partial sync** if deltas remain)
2. ClickUp parent name and url
3. Spec No and branch pushed (if committed)
4. Subtask inventory: **ready** count processed; skipped (**Deployed** / **TO DO** / other); deltas merged (name → doc/phase; new vs changed)
5. **Developed → inprogress** revert on parent (yes/no)
6. Files created or changed under `spec/{SpecNo}/`
7. ClickUp status: parent + N ready subtasks → **speced**, or why statuses were not changed

If any step fails, report what completed and what did not. Do **not** set ClickUp to **speced** unless push succeeded and the full-sync gate passed for the ready inventory.
