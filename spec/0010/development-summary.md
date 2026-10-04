# Development summary — Feedback 0010

| Field | Value |
|-------|-------|
| Ticket | `0010` |
| Feedback id | `vQQz6Ho4d7UnLyz_Sf3Pc` |
| Title | When automated development feedback can see two commits |
| Type | `bug` |
| Completed | `2026-10-04` |

## What was delivered

`/feedback-fix` now requires **exactly one** git commit per ticket on `deploy_staging`. Agents put the commit **message** in `development-summary.md` Deploy section and report the short sha only in the finish report after push — no follow-up `record staging deploy commit`. Command, skill, template, MCP watcher prompt, and README were updated.

## Where to see it

| Surface | Location |
|---------|----------|
| Agent contract | `.cursor/commands/feedback-fix.md` Phase C + Agent mode rules |
| Skill / template | `.cursor/skills/feedback-fix/SKILL.md`, `development-summary-template.md` |
| Watcher prompt | `tooling/support-feedback-mcp/src/statusCommands.ts` |
| Spec | `spec/0010/` |
| Staging effect | Next `/feedback-fix` run creates one commit (observable via `git log` on `deploy_staging`) |

## Feature details

- Forbidden: second commit that only back-fills Deploy sha in `development-summary.md`.
- Required: one `git commit` + one `git push origin deploy_staging`; sha via `git rev-parse --short HEAD` in the finish report.
- This ticket itself ships as a single commit demonstrating the rule.

## Code and docs touched

| Root | Paths |
|------|-------|
| `.cursor/` | `commands/feedback-fix.md`, `skills/feedback-fix/SKILL.md`, `skills/feedback-fix/development-summary-template.md` |
| `tooling/support-feedback-mcp/` | `src/statusCommands.ts`, `README.md` |
| `spec/0010/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run build --prefix tooling/support-feedback-mcp
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0010: single commit for automated feedback-fix` |
| Push | triggers `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
