# Support Feedback MCP

stdio MCP server for WebOnOne Support bug/feature reports. Used by Cursor `/feedback-fix` to list, fetch, and update feedback status.

## Prerequisites

- `SUPPORT_FEEDBACK_AUTOMATION_API_KEY` on Support backend (validates list/get/status for `/feedback-fix`)
- Support API base URL (staging or production)

## Environment variables

Set these on the MCP server entry in Cursor (user MCP settings preferred; **do not commit tokens** in [`.cursor/mcp.json`](../../.cursor/mcp.json)).

| Variable | Example |
|----------|---------|
| `SUPPORT_API_BASE_URL` | `https://staging-support.webonone.com/api/v1` |
| `SUPPORT_FEEDBACK_AUTOMATION_API_KEY` | Long-lived secret (min 32 chars; `openssl rand -hex 32`) |

Set `SUPPORT_FEEDBACK_AUTOMATION_API_KEY` to the **same value** on the Support backend and on the MCP/watcher host. The API sends header `X-Support-Feedback-Automation-Key` (list/get/status only).

**Ops / after `npm run env:apply`:** `SUPPORT_FEEDBACK_AUTOMATION_API_KEY` and `SUPPORT_API_BASE_URL` are written to `support/backend/.env` from repo-root `production.env`. Point Cursor MCP env at the same values (user MCP settings — never commit secrets).

Local dev: `http://127.0.0.1:4021/api/v1`

## Build and run

```bash
cd tooling/support-feedback-mcp
npm install
npm run build
```

Cursor starts the server via `node tooling/support-feedback-mcp/dist/index.js` (paths relative to repo root).

## Tools

| Tool | Support API |
|------|-------------|
| `feedback_list` | `GET /feedback` |
| `feedback_get` | `GET /feedback/:id` or `GET /feedback/ticket/:ticketNumber` when `id` is four digits |
| `feedback_update_status` | `PATCH /feedback/:id/status` |

List supports `ticket` query (e.g. `0001`). Reports include `ticketNumber`.

## Workflow

1. Super admin sets a report to **Ready to Developed** (`ready_to_develop`) on hosted `/feedback`.
2. Run `/feedback-fix` or `/feedback-fix 0001` in Cursor (staging or live API; spec/code changes are local).
3. Agent writes `spec/{ticket}/spec.md` and `plan.md`, sets `planned`, implements, then sets `developed`.
4. Super admin later sets **Staging** and **Closed** in the UI after deploy/release.

## Automated runs (Cursor CLI on a server)

Support POSTs every real status change to a **localhost listener**. The listener maps status → CLI command. First mapped command: `ready_to_develop` → `agent` + `/feedback-fix {ticket}`. Other statuses return 202 and skip until you add a row in `src/statusCommands.ts`.

### One-time setup

1. `agent login` on the server (or set `CURSOR_API_KEY`).
2. Same env as MCP: `SUPPORT_API_BASE_URL`, `SUPPORT_FEEDBACK_AUTOMATION_API_KEY` (fixed secret; no JWT expiry). On IIS/staging ops hosts these are in `support/backend/.env` after `npm run env:apply`.
3. From repo root, enable workspace MCP for the CLI (once per machine):

   ```bash
   agent mcp enable support-feedback
   ```

   Requires [`.cursor/mcp.json`](../../.cursor/mcp.json) with the `support-feedback` server (use **user** MCP settings for tokens — do not commit JWTs).

4. Cursor **Agents → Run mode**: **Run Everything** or an allowlist that matches [`.cursor/permissions.json`](../../.cursor/permissions.json) `/feedback-fix` instructions (CLI uses `--force` / `--approve-mcps`).

### Run the listener (preferred)

Support `PATCH /feedback/:id/status` fire-and-forgets `POST {FEEDBACK_FIX_TRIGGER_URL}` with `{ ticketNumber, status, fromStatus, id, type, title }` and header `X-Feedback-Fix-Trigger-Secret`. Bind is **127.0.0.1 only**.

```powershell
.\tooling\feedback-fix-watcher.ps1 -Listen
```

Or from repo root: `npm run feedback-fix:listen`

Task Scheduler: at logon as the user that owns the clone and Cursor login; “Start in” = repo root.

### Poll fallback

```powershell
.\tooling\feedback-fix-watcher.ps1
.\tooling\feedback-fix-watcher.ps1 -Once
.\tooling\feedback-fix-watcher.ps1 -Once -Ticket 0001
```

| Env | Default | Purpose |
|-----|---------|---------|
| `FEEDBACK_FIX_TRIGGER_URL` | `http://127.0.0.1:4055/run` | Support POST target |
| `FEEDBACK_FIX_TRIGGER_SECRET` | (required for listen) | Shared secret (min 32 chars) |
| `FEEDBACK_FIX_LISTEN_PORT` | `4055` | Listener port |
| `FEEDBACK_FIX_POLL_INTERVAL_MS` | `120000` | Poll interval |
| `FEEDBACK_FIX_WORKSPACE` | repo root | Path passed to `agent --workspace` |
| `FEEDBACK_FIX_AGENT_CMD` | `agent.cmd` / `agent` | Cursor CLI entrypoint |
| `FEEDBACK_FIX_LOCK_PATH` | `.cursor/feedback-fix-watcher.lock` | Prevents overlapping agents |
| `FEEDBACK_FIX_LOG_DIR` | `.cursor/logs/feedback-fix-watcher` | Per-run agent stdout/stderr logs |

If the listener is down, Support still saves status. The ticket stays `ready_to_develop` until the listener is up or someone runs `/feedback-fix` manually.

**Windows:** The watcher spawns Cursor’s bundled `node.exe` + `index.js` (not `agent.cmd` with `shell: true`) so the full prompt runs. CLI prompts are single-line and instruct writing both `spec.md` and `plan.md` without Plan-mode confirmation.
