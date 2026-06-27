# ClickUp → Spec update workflow

Apply **comment** feedback from **speced** ClickUp tasks in the **webonone_v2** space to the matching spec under `spec/{SpecNo}/`, commit, and push.

**Scope:** comment-driven spec edits only. New or changed **subtasks** and spec body sync → run `/clickup-spec` instead.

Run the full workflow end-to-end without asking for confirmation unless blocked.

## Permissions — auto-run

Invoking this command **pre-authorizes** ClickUp MCP (including comments), git on `spec/{SpecNo}`, and spec file writes. Execute immediately; do not wait for Run/Approve prompts. Requires Run Mode **Allowlist** or **Run Everything** — see [`.cursor/permissions.json`](.cursor/permissions.json). Still ask which task only when multiple **speced** tasks exist and none was named in chat.

## ClickUp (MCP: ClickUp)

1. **Space:** `webonone_v2` (resolve via workspace hierarchy if needed).
2. **Find tasks:** Filter tasks where `status` is **`speced`** in that space. Exclude closed tasks.
3. **Pick task:**
   - If the user named a task or spec number in chat, use that task.
   - Else if exactly one **speced** task exists, use it.
   - Else list all **speced** tasks (name, id, url) and ask the user which one to update.
4. **Read task:** Fetch the parent task with `include: ["description", "subtasks"]`.
   - Parse **Spec No** from the parent description: `Spec No: X.Y.Z` (semver triplet). If missing, stop and tell the user.
   - Confirm `spec/{SpecNo}/` exists in the repo. If not, stop — run `/clickup-spec` first to create the spec package.
5. **Read comments (parent + subtasks):**
   - Parent: `clickup_get_task_comments` for the parent task id.
   - For each comment with `reply_count > 0`, call `clickup_get_threaded_comments` with that comment id.
   - For **each subtask** id from the parent fetch, repeat comments + threaded replies.
   - Treat all comment text (parent, subtasks, threaded replies) as update source material. Skip empty comments and system-only noise; preserve author intent from substantive feedback.
6. **Do not change ClickUp status** — task stays **speced**.

## Git branch and folder

| Item | Value |
|------|--------|
| Spec folder | `spec/{SpecNo}/` |
| Branch name | `spec/{SpecNo}` |
| Base branch | `master` |

**Branch workflow:**

```bash
git checkout spec/{SpecNo}
git pull origin spec/{SpecNo}
```

If branch `spec/{SpecNo}` does not exist locally, try `git fetch origin spec/{SpecNo}` and check it out. If the remote branch is missing, stop and report — the spec was never pushed.

## Update the spec

Merge comment feedback into the existing `spec/{SpecNo}/` package. Read current files before editing.

### Mapping comments to docs

| Comment context | Target |
|-----------------|--------|
| Parent task comments | `01-overview.md`, `README.md` (what changed / scope), or cross-cutting sections |
| Subtask name matches a numbered doc topic | That doc (e.g. subtask "Media embed" → `03-media-embed-package.md`) |
| Implementation / phasing feedback | `07-implementation-plan.md` |
| New area not covered by an existing doc | Add a numbered doc following prior spec naming; index it in `README.md` |

### Content rules

- **Incremental edits only** — do not rewrite the whole spec; integrate feedback into the right sections.
- Fix typos in prose but preserve reviewer intent.
- Update `README.md` **What changed** table or add a short **Revision history** bullet when comments alter scope or acceptance criteria.
- Respect `microservice-architecture.mdc` when comments touch integration boundaries.
- If a comment contradicts existing spec text, prefer the **latest comment** and note the change briefly in `README.md` or `07-implementation-plan.md`.
- If comments are ambiguous or conflicting, apply the clearest interpretation and note open questions in `07-implementation-plan.md` under a **Open items** subsection.

## Commit and push

When spec files are updated:

```bash
git add spec/{SpecNo}/
git commit -m "space updated"
git push origin spec/{SpecNo}
```

Use exactly the commit message **`space updated`**.

## Finish report

Reply with:

1. ClickUp task name and url
2. Spec No and branch pushed
3. List of files changed under `spec/{SpecNo}/`
4. Short summary of what feedback was applied (by doc or theme)

If any step fails, report what completed and what did not. Do **not** commit or push partial work unless the user asked to stop mid-flow.
