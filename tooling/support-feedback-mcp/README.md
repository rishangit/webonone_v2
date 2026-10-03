# Support Feedback MCP

stdio MCP server for WebOnOne Support bug/feature reports. Used by Cursor `/feedback-fix` to list, fetch, and update feedback status.

## Prerequisites

- Identity JWT for a **super_admin** user (required for `feedback_update_status`)
- Support API base URL (staging or production)

## Environment variables

Set these on the MCP server entry in Cursor (user MCP settings preferred; **do not commit tokens** in [`.cursor/mcp.json`](../../.cursor/mcp.json)).

| Variable | Example |
|----------|---------|
| `SUPPORT_API_BASE_URL` | `https://staging-support.webonone.com/api/v1` |
| `SUPPORT_FEEDBACK_BEARER_TOKEN` | `eyJ...` (Bearer access token) |

**Ops / after `npm run env:apply`:** same keys are written to `support/backend/.env` from repo-root `production.env` (`SUPPORT_FEEDBACK_BEARER_TOKEN` + `SUPPORT_API_BASE_URL` derived from `ORIGIN_SUPPORT`). Point Cursor MCP env at those values or copy into user MCP settings.

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
