# Plan — Feedback 0010

## Approach

Fix the `/feedback-fix` agent contract so Deploy sha is never written into `development-summary.md` via a second commit. Align command, skill, template, and watcher prompt. No product UI/API changes.

## Implementation steps

1. **Command** — `.cursor/commands/feedback-fix.md`
  - Phase C: write `development-summary.md` with Deploy branch + intended commit **message** (and push note); do **not** require the short sha in the file before commit.
  - Explicit: **exactly one** `git commit`, then one `git push`. After push, put short sha only in the **finish report**.
  - Agent mode rules: forbid second commits that only update Deploy sha / `record staging deploy commit`; forbid amending after push for that purpose.
  - If push fails: leave status `developed`; may edit Deploy notes on disk for the next retry but still one commit when retrying.

2. **Skill** — `.cursor/skills/feedback-fix/SKILL.md`
  - Deploy branch section: single commit; sha in finish report only.
  - Phase list: `development-summary.md` → **one** commit → push → `staging`.

3. **Template** — `.cursor/skills/feedback-fix/development-summary-template.md`
  - Deploy table: branch, commit message, push result after push success text in finish report; note that sha must not be back-filled with a follow-up commit.

4. **Watcher prompt** — `tooling/support-feedback-mcp/src/statusCommands.ts`
  - Add: exactly one commit; do not create a follow-up commit to record the deploy sha.

5. **This ticket’s Phase C** — demonstrate the fix: one commit `feedback 0010: …` including all of the above + `spec/0010/*`; no second commit.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before editing docs/tooling | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Agents may still want the sha in the summary file; finish report + optional “Commit message” row is enough for reporters.
- Do not use `git commit --amend` after push; pre-push amend is unnecessary if sha is omitted from the file.
