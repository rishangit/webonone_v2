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
| `SwitchMode` to `plan` | Pick report, claim, implement, verify, update status |
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

## Implement by `type`

Use title, description, and `attachmentUrl` (if present) as the spec. Route work per [`AGENTS.md`](../../AGENTS.md) and [platform-orchestrator skill](../skills/platform-orchestrator/SKILL.md).

| `type` | Behavior |
|--------|----------|
| `bug` | Fix the defect in the owning service(s). |
| `feature` | Implement when scope is small (one service or a few files, no new spec package). If the work clearly needs a new `spec/X.Y.Z` package, touches **3+ service roots**, or is an epic, **stop after claim**, tell the user to use ClickUp `/clickup-spec` — leave status **`in_progress`** (do not mark `developed`). |

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
| Blocked / epic / needs ClickUp spec | Stay **`in_progress`** |
| Implementation failed | Stay **`in_progress`** |

Do **not** set `staging` or `closed` — super admin moves items there after deploy/release.

## Finish report

Summarize: feedback id, type, title, services touched, verification commands run, final status.
