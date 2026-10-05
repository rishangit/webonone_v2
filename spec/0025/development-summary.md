# Development summary — Feedback 0025

| Field | Value |
|-------|-------|
| Ticket | `0025` |
| Feedback id | `PnKJI6e50npW5Ii7lhXKZ` |
| Title | The AI chat window should be full width. |
| Type | `feature` |
| Completed | 2026-10-05 |

## What was delivered

Desktop WebOnOne AI chat now has an expand control (left of Close) that grows the right rail until it meets the left navigation. The expanded width tracks sidebar collapse/expand. Mobile stays full-width with no expand button. Help articles (`en` / `si`) document the control.

## Where to see it

| Surface | Path |
|---------|------|
| Staging WebOnOne | Open app → header chat → desktop expand icon |
| Support help | `/docs/app-preferences/ai-assistant` |
| Local | `npm run dev:webonone` → same header chat flow |

## Feature details

- Expand / collapse icons only on desktop in-flow rail (`AppEndPanel` `expandable`).
- Expanded mode hides `#main-content` so the panel fills beside the sidebar.
- Closing the assistant resets to the narrow rail on next open.
- Peer filter panels and website assistant are unchanged (opt-in props).

## Code and docs touched

| Root | Key paths |
|------|-----------|
| `ui-kit/package` | `AppEndPanel.tsx`, `styles/globals.css` (+ rebuilt `dist/`) |
| `webonone-v2/frontend` | `AppAssistant.tsx`, `locales/{en,si}/shell.json` |
| `support/frontend` | `content/{en,si}/app-preferences/ai-assistant.md` |
| `spec/0025/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/ui-kit
npm run lint -w @webonone/ui-kit
npm run build -w @webonone/ui-kit
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/webonone-frontend
npm run type-check -w support-root
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0025: full-width AI chat expand` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
