# Feedback 0010 — When automated development feedback can see two commits

| Field | Value |
|-------|-------|
| Ticket | `0010` |
| Feedback id | `vQQz6Ho4d7UnLyz_Sf3Pc` |
| Type | `bug` |
| Title | When automated development feedback can see two commits |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

`/feedback-fix` must create **exactly one** git commit per ticket on `deploy_staging`. A follow-up commit that only patches `development-summary.md` with the deploy sha must not run — it retriggers staging CI and delays deployment.

## Problem / goal

Today (seen on tickets `0007` and `0008`):

1. Agent commits product code + `spec/{ticket}/` with message `feedback {ticket}: {title}`.
2. Agent then edits `development-summary.md` Deploy → Commit with the short sha (or fills `_(filled after push)_`) and creates a second commit `feedback {ticket}: record staging deploy commit`.
3. Each push/commit on `deploy_staging` triggers `.github/workflows/deploy-staging.yml`, so the second commit delays the pipeline.

**Goal:** One commit containing all ticket work (code + `spec.md` + `plan.md` + `development-summary.md`). Report the resulting sha in the **finish report** (chat) after push — never a second commit solely to record that sha.

## Acceptance criteria

1. `.cursor/commands/feedback-fix.md` Phase C and Agent mode rules require **exactly one** `git commit` per ticket before `git push origin deploy_staging`, and **forbid** follow-up commits such as `record staging deploy commit` that only update the Deploy sha in `development-summary.md`.
2. `.cursor/skills/feedback-fix/SKILL.md` and `development-summary-template.md` match: Deploy table uses branch + **commit message**; sha is for the finish report after push (not a second commit).
3. `tooling/support-feedback-mcp/src/statusCommands.ts` ready_to_develop prompt tells the agent to make a **single** commit (no post-push summary-only commit).
4. Completing this ticket itself produces **one** commit on `deploy_staging` (no `record staging deploy commit` follow-up).
5. No product service runtime change required; docs/tooling prompt only.

## Services affected

| Area | Change |
|------|--------|
| `.cursor/commands/feedback-fix.md` | Single-commit Phase C + forbidden follow-up |
| `.cursor/skills/feedback-fix/` | Skill + development-summary template |
| `tooling/support-feedback-mcp/` | Watcher prompt wording |
| `spec/0010/` | This package |

## Out of scope

- Changing GitHub Actions or IIS deploy scripts
- Rewriting history for `0007` / `0008` second commits
- Amending commits after push
- Setting Support status `closed`

## Verification

```bash
# Docs/prompt only — no service workspace type-check required.
# Confirm statusCommands builds (optional):
npm run type-check -w @webonone/support-feedback-mcp
```

Manual: after Phase C for this ticket, `git log -2 --oneline` on `deploy_staging` shows a single new `feedback 0010: …` commit (not two).
