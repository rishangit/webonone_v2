# Support Feedback MCP

stdio MCP server for WebOnOne Support bug/feature reports. Used by Cursor `/feedback-fix` to list, fetch, and update feedback status.

## Prerequisites

- Identity JWT for a **super_admin** user (required for `feedback_update_status`)
- Support API base URL (staging or production)

## Environment variables

Set these on the MCP server entry in Cursor (project [`.cursor/mcp.json`](../../.cursor/mcp.json) or user MCP settings). **Do not commit tokens.**

| Variable | Example |
|----------|---------|
| `SUPPORT_API_BASE_URL` | `https://staging-support.webonone.com/api/v1` |
| `SUPPORT_FEEDBACK_BEARER_TOKEN` | `eyJ...` (Bearer access token) |

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
| `feedback_get` | `GET /feedback/:id` |
| `feedback_update_status` | `PATCH /feedback/:id/status` |

## Workflow

1. Super admin sets a report to **Ready to Developed** (`ready_to_develop`) on hosted `/feedback`.
2. Run `/feedback-fix` in Cursor Agent mode (reads staging or live API; code changes are local).
3. Agent claims `in_progress`, implements, then sets `developed`.
4. Super admin later sets **Staging** and **Closed** in the UI after deploy/release.
