# Development summary template

Copy structure into `spec/{ticketNumber}/development-summary.md` after implementation (Phase C).

## Required sections

1. **Header table** — ticket, feedback id, title, type, completed date (ISO).
2. **What was delivered** — 2–4 sentences vs spec acceptance criteria.
3. **Where to see it** — table: Staging URL/nav paths, Support `/docs/…` slugs, local `npm run dev:…` and routes.
4. **Feature details** — bullets for behavior, roles, limits, config.
5. **Code and docs touched** — table of service roots and key paths.
6. **Verification run** — fenced shell block with exact `type-check` / `lint` commands that passed.
7. **Deploy** — see below.
8. **Support status** — `staging` after successful push (`closed` remains super admin).

### §7 Deploy (required table)

Run detection **before** the single commit (from repo root):

```bash
npm run deploy:detect -- --base origin/deploy_staging --head HEAD --print
```

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback {ticket}: …` |
| Workflow | Push runs [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml) |
| **Expected mode** | `mode` from detect JSON (`none`, `selective`, or `all`) |
| **Services** | Comma-separated `services` from detect (or `(none)` when `mode=none`) |
| **Why** | `reason` from detect — mention `ui-kit` / `platform-embed` fan-out when applicable |
| Detect command | Same command as above (or note if you used `HEAD~1` because `origin/deploy_staging` was unavailable) |

Do **not** put the deploy short sha in this file before commit, and do **not** add a second commit after push just to record the sha — the finish report carries the sha and should paste GitHub Actions **Deploy summary** / job summary to confirm mode matched.

**Deploy modes (short):**

- `none` — no IIS paths changed; workflow skips migrate/deploy.
- `selective` — only listed services get `deploy:<key>` (can be all eleven keys after shared-library changes; that is still selective, not `deploy:all`).
- `all` — force-full only (`package.json`, deploy tooling, `--force-all`, or missing base SHA). See [tooling/CICD.md](../../tooling/CICD.md).
