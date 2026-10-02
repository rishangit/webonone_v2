# Support feedback → Fix workflow

Implement a bug fix or small feature from the hosted Support **Bug and feature reports** queue when status is **`ready_to_develop`** (UI: **Ready to Developed**). Claim as **In Progress**, implement locally, verify, then mark **`developed`** (UI: **Developed**).

Statuses (super admin manages all except the automated transitions below):

| API value | UI label | Who sets it |
|-----------|----------|-------------|
| `todo` | To Do | Default on create |
| `ready_to_develop` | Ready to Developed | Super admin (queue for `/feedback-fix`) |
| `in_progress` | In Progress | `/feedback-fix` when work starts |
| `developed` | Developed | `/feedback-fix` when implementation verified |
| `staging` | Staging | Super admin (deployed to staging) |
| `closed` | Closed | Super admin (done / released) |

Run in **Agent mode** end-to-end without asking for confirmation unless blocked.

**Standalone workflow:** `/feedback-fix` uses only the **Support Feedback MCP** and the report’s `title` / `description` as the requirement. It does **not** use ClickUp MCP and is **not** chained to `/clickup-spec`, `/clickup-plan`, or `/clickup-build`. Run it on its own whenever you want the next `ready_to_develop` item implemented. Large features are handled inside this workflow (scope guard below), not by redirecting to ClickUp.

## Permissions — auto-run

Invoking `/feedback-fix` **pre-authorizes** Support Feedback MCP (`feedback_list`, `feedback_get`, `feedback_update_status`), git (branch work when needed), service source edits, and verification shell commands (`npm`, `npx`, `node`). Execute immediately; do not wait for Run/Approve prompts. Requires Run Mode **Allowlist** or **Run Everything** — see [`.cursor/permissions.json`](.cursor/permissions.json).

## MCP setup

Server: **`support-feedback`** in [`.cursor/mcp.json`](.cursor/mcp.json). Point at **staging or live** Support API (not local). Requires env:

- `SUPPORT_API_BASE_URL` — e.g. `https://staging-support.webonone.com/api/v1`
- `SUPPORT_FEEDBACK_BEARER_TOKEN` — super_admin JWT (set in Cursor MCP env; never commit)

See [`tooling/support-feedback-mcp/README.md`](../../tooling/support-feedback-mcp/README.md).

## Agent mode only

| Forbidden | Required |
|-----------|----------|
| `SwitchMode` to `plan` | Pick report, claim, read title/description and develop requirement, implement, verify, update status |
| `AskQuestion` for which report when one can be resolved | Auto-pick per rules below |
| Mark `developed` without verification | Run type-check/lint for touched workspaces |
| Set `staging` or `closed` | Super admin only in Support UI |

## Pick a report — no questions

1. If the user named a **feedback id** (21-char id or pasted from the list), call **`feedback_get`**. The report **must** have `status === "ready_to_develop"`. Otherwise stop with a clear message.
2. Else call **`feedback_list`** with `status: "ready_to_develop"`, `pageSize: 100`. If `hasMore`, paginate until all ready items are collected.
3. If the user said **bug** or **feature** (or “bugs only”), filter by `type`.
4. Else use a **single queue** (bugs and features together).
5. Pick **one** report: sort by `createdAt` ascending (oldest first). Tie-break: `id` lexicographic.
6. If no matches, stop: “No feedback in ready_to_develop.”

## Claim

Immediately call **`feedback_update_status`** with `status: "in_progress"` for the picked id **before** writing code. This prevents double-pick across parallel runs.

## Read report and develop the requirement

After claim, call **`feedback_get`** for the picked id (even if the list response already included fields — use the full report). **Do not edit product code** until you have turned the report into an explicit requirement.

From the JSON, read at minimum:

| Field | Use |
|-------|-----|
| `title` | One-line summary of what to fix or build |
| `description` | Full user intent, steps to reproduce, expected vs actual, constraints |
| `type` | `bug` vs `feature` — drives scope guard below |
| `attachmentUrl` | Optional screenshot — open or fetch when repro/UI context is unclear |

**Develop the requirement** (write this in the session before searching the codebase):

1. **Restate** — Paraphrase `title` + `description` in your own words (problem or goal).
2. **Acceptance criteria** — 2–5 concrete, testable bullets (what “done” means for this report).
3. **Services / areas** — Which monorepo roots and features are likely involved (per [`AGENTS.md`](../../AGENTS.md)); note unknowns to resolve via search.
4. **Scope check** — If the description is larger than the title, **implement in this session** starting with the title (MVP), then add description items while they stay in one or two service roots. Do **not** stop after claim without coding unless truly blocked (missing credentials, ambiguous product fact, or hard dependency on another team).
5. **Open questions** — Only if `title`/`description`/`attachmentUrl` are ambiguous; infer from code when possible. Do not use `AskQuestion` to pick a report — only to unblock missing product facts after reading the text.

Implementation must satisfy the acceptance criteria derived from **title** and **description**, not a different interpretation.

## Implement by `type`

Route work per [platform-orchestrator skill](../skills/platform-orchestrator/SKILL.md). Use the developed requirement as the spec; refer back to the original `title` and `description` when verifying the fix.

| `type` | Behavior |
|--------|----------|
| `bug` | Fix the defect in the owning service(s). |
| `feature` | **Always implement** after claim: deliver the **title** first, then as much of the **description** as fits one or two service roots in the same session. Mark **`developed`** when the title is done and any in-scope description items shipped; note follow-ups in the finish report. Only leave **`in_progress`** when blocked mid-implementation (not because the description is long). Splitting extra reports in Support is optional for work left to a later run. Do **not** invoke ClickUp or spec workflows from this command. |

Match existing patterns; `@/` aliases; remove unused imports in touched files.

## User-visible changes

If the fix changes WebOnOne or shell UX, update Support help articles per [help-articles skill](../skills/help-articles/SKILL.md).

## Verify

Before marking developed:

```bash
npm run type-check -w <touched-service-root>
npm run lint -w <touched-frontend-workspace>   # when frontend changed
```

Use the workspaces you actually edited.

## Finish status

| Outcome | Support status |
|---------|----------------|
| Fix verified in this session | **`developed`** via **`feedback_update_status`** |
| Blocked / epic / out of scope for one session | Stay **`in_progress`** (super admin may revert to **`ready_to_develop`** after splitting the report) |
| Implementation failed | Stay **`in_progress`** |

Do **not** set `staging` or `closed` — super admin moves items there after deploy/release.

## Finish report

Summarize: feedback id, type, **title** (as reported), short restatement of the requirement, services touched, verification commands run, final status.
