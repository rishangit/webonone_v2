# Development summary template

Copy structure into `spec/{ticketNumber}/development-summary.md` after implementation (Phase C).

## Required sections

1. **Header table** — ticket, feedback id, title, type, completed date (ISO).
2. **What was delivered** — 2–4 sentences vs spec acceptance criteria.
3. **Where to see it** — table: Staging URL/nav paths, Support `/docs/…` slugs, local `npm run dev:…` and routes.
4. **Feature details** — bullets for behavior, roles, limits, config.
5. **Code and docs touched** — table of service roots and key paths.
6. **Verification run** — fenced shell block with exact `type-check` / `lint` commands that passed.
7. **Deploy** — table: branch `deploy_staging`, commit short sha + message, push result, note that push runs `.github/workflows/deploy-staging.yml`.
8. **Support status** — `staging` after successful push (`closed` remains super admin).
