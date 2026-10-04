# Support feedback → Spec, plan, and fix workflow

Implement a bug fix or small feature from the hosted Support **Bug and feature reports** queue. Each report has a **four-digit ticket** (`0001`, `0002`, …). `/feedback-fix` writes a repo spec under `spec/{ticket}/`, plans in **Plan mode**, marks the report **`planned`**, then implements from that spec and marks **`developed`** when verified.

Statuses (super admin manages all except the automated transitions below):

| API value | UI label | Who sets it |
|-----------|----------|-------------|
| `todo` | To Do | Default on create |
| `ready_to_develop` | Ready to Developed | Super admin (queue for spec + plan) |
| `planned` | Planned | `/feedback-fix` after spec + plan are saved |
| `in_progress` | In Progress | `/feedback-fix` when implementation starts |
| `developed` | Developed | `/feedback-fix` when implementation verified |
| `staging` | Staging | `/feedback-fix` after push to `deploy_staging` (deployed to staging) |
| `closed` | Closed | Super admin (done / released) |

Run end-to-end without asking for confirmation unless blocked.

**Standalone workflow:** Support Feedback MCP + on-disk `spec/{ticket}/` only — no ClickUp MCP. Each invocation targets one report (by ticket, id, or queue rules).

## Permissions — auto-run

Invoking `/feedback-fix` **pre-authorizes** Support Feedback MCP (`feedback_list`, `feedback_get`, `feedback_update_status`), **`SwitchMode` to `plan`** (planning phase only), git (including commit and push to **`deploy_staging`**), writes under `spec/{ticket}/`, service source edits, and verification shell commands (`npm`, `npx`, `node`). Execute immediately; do not wait for Run/Approve prompts. See [`.cursor/permissions.json`](.cursor/permissions.json).

## MCP setup

Server: **`support-feedback`** in [`.cursor/mcp.json`](.cursor/mcp.json). Point at **staging or live** Support API (not local). Requires env:

- `SUPPORT_API_BASE_URL` — e.g. `https://staging-support.webonone.com/api/v1`
- `SUPPORT_FEEDBACK_AUTOMATION_API_KEY` — long-lived secret (same value as Support `backend/.env`; never commit)

See [`tooling/support-feedback-mcp/README.md`](../../tooling/support-feedback-mcp/README.md).

## Pick a report — no questions

Arguments: `/feedback-fix`, `/feedback-fix 0001`, `/feedback-fix <21-char-id>`, optional **bug** / **feature** filter in the user message.

1. If the user named a **four-digit ticket** (`0001`–`9999`, zero-padded), call **`feedback_get`** with that ticket string. Normalize input: `1` → `0001`, `42` → `0042`.
2. Else if the user named a **feedback id** (21-char nanoid), call **`feedback_get`** with that id.
3. For a **named** ticket or id, the report must be **`ready_to_develop`** or **`planned`** (wrong status → stop with a clear message).
4. Else call **`feedback_list`** twice if needed: collect all **`ready_to_develop`**, then all **`planned`** (`pageSize: 100`, paginate). Optional **bug** / **feature** filter on `type`.
5. Pick **one** report:
   - Prefer oldest **`ready_to_develop`** (`createdAt` asc, tie-break `id`).
   - If none, prefer oldest **`planned`** for the implementation phase.
6. If no matches, stop: “No feedback in ready_to_develop or planned.”

Record **`ticketNumber`** from the MCP JSON for all spec paths and the finish report.

## Two phases (same command, same session)

| Current status | Phase | Outcome status |
|----------------|-------|----------------|
| `ready_to_develop` | **Spec + plan** | `planned` |
| `planned` | **Implement + deploy** | `staging` (or stay `in_progress` if blocked) |

After picking, call **`feedback_get`** for the full report (`title`, `description`, `type`, `attachmentUrl`, `ticketNumber`, `id`).

### Phase A — Spec and plan (`ready_to_develop`)

**Do not edit product service code** until Phase B.

1. **Develop the requirement** (in chat before files):
   - Restate problem/goal from `title` + `description`.
   - 2–5 acceptance criteria.
   - Likely monorepo roots ([`AGENTS.md`](../../AGENTS.md)).
   - Scope guard for large **feature** descriptions (MVP = title first).
2. **Write spec** — create `spec/{ticketNumber}/spec.md` (e.g. `spec/0001/spec.md`):
   - Header: ticket, feedback id, type, title, reporter email, link to `attachmentUrl` when present.
   - Sections: overview, problem/goal, acceptance criteria, services affected, out of scope, verification commands.
   - Mirror tone/structure of recent `spec/*/` packages (e.g. `01-overview.md` depth in a single `spec.md` for feedback-sized work).
3. **Plan** — Produce the implementation plan from `spec/{ticketNumber}/spec.md` and relevant `.cursor/rules/` / `AGENTS.md`. Save to **`spec/{ticketNumber}/plan.md`** (markdown, not in-chat only). In **Cursor IDE**, use `SwitchMode` to **`plan`**, then switch back to **Agent** mode. In **Cursor CLI** (`agent -p`), stay in Agent mode: write `plan.md` directly — do not SwitchMode to plan and do not wait for user confirmation.
4. **`feedback_update_status`** → **`planned`** only after both files exist on disk.
5. **Continue** into Phase B in the **same session** unless truly blocked.

### Phase B — Implement (`planned`, or same run after Phase A)

1. **`feedback_update_status`** → **`in_progress`** before product code (claim implementation).
2. Implement against `spec/{ticketNumber}/spec.md` and `plan.md` — not a different interpretation.
3. Route work per [platform-orchestrator skill](../skills/platform-orchestrator/SKILL.md).
4. User-visible WebOnOne/shell changes → [help-articles skill](../skills/help-articles/SKILL.md).
5. Verify:

```bash
npm run type-check -w <touched-service-root>
npm run lint -w <touched-frontend-workspace>   # when frontend changed
```

6. **`feedback_update_status`** → **`developed`** when acceptance criteria pass.

### Phase C — Summary, commit, staging deploy (`planned` continuation, same session)

After Phase B verification:

1. **Write** `spec/{ticketNumber}/development-summary.md` using [development-summary template](../skills/feedback-fix/development-summary-template.md):
   - What was delivered (vs acceptance criteria).
   - **Where to see it** — staging URLs, nav paths, Support doc slugs, local dev commands.
   - Feature details for the reporter.
   - Files/services changed, verification commands run, deploy commit sha.
2. **Git** (branch **`deploy_staging`** per [tooling/CICD.md](../../tooling/CICD.md) — push triggers staging CI + IIS deploy):
   - `git fetch origin deploy_staging`
   - Check out `deploy_staging` and integrate your work (`git pull --rebase origin deploy_staging` when safe; resolve conflicts on the ops machine if needed).
   - Stage all feedback-fix changes **including** `spec/{ticketNumber}/` (`spec.md`, `plan.md`, `development-summary.md`) and product code.
   - Commit with a single-line message: `git commit -m "feedback {ticketNumber}: {short title}"` (Windows: no here-strings).
   - `git push origin deploy_staging`
3. Only after **successful push**, **`feedback_update_status`** → **`staging`** (Support UI label **Staging** = deployed to staging hosts).
4. Do **not** set **`closed`** — super admin only after release sign-off.

If push fails, leave status **`developed`** and record the error in `development-summary.md` under Deploy.

| `type` | Behavior |
|--------|----------|
| `bug` | Fix in owning service(s). |
| `feature` | Ship title (MVP) then in-scope description items in one or two service roots; note deferrals in the finish report. |

Match existing patterns; `@/` aliases; remove unused imports in touched files.

## Spec folder (per ticket)

| File | When |
|------|------|
| `spec/{ticket}/spec.md` | Phase A |
| `spec/{ticket}/plan.md` | Phase A |
| `spec/{ticket}/development-summary.md` | Phase C (before commit) |

## Agent mode rules

| Forbidden | Required |
|-----------|----------|
| `AskQuestion` to pick a report when rules resolve one | Auto-pick per rules above |
| Mark `developed` without verification | type-check/lint on touched workspaces |
| Mark `staging` without successful push to `deploy_staging` | Push then `staging` |
| Set `closed` | Super admin only in Support UI |
| Skip on-disk spec/plan for `ready_to_develop` | Write `spec/{ticket}/spec.md` and `plan.md` before `planned` |
| Skip `development-summary.md` before commit | Summary on disk before `git commit` |
| Product code during Phase A | Spec + plan files only |

## Finish status

| Outcome | Support status |
|---------|----------------|
| Spec + plan saved | **`planned`** |
| Fix verified, not yet pushed | **`developed`** |
| Pushed to `deploy_staging` | **`staging`** |
| Blocked mid-implementation | **`in_progress`** |

Do **not** set `closed`.

## Finish report

Summarize: **ticket number**, feedback id, type, **title**, paths `spec/{ticket}/spec.md`, `plan.md`, `development-summary.md`, services touched, verification commands, **commit sha** on `deploy_staging`, final Support status (`staging` or `developed` if push failed).
