# Development summary — Feedback 0020

| Field | Value |
|-------|-------|
| Ticket | `0020` |
| Feedback id | `pEjHjn4wL1kgoS2C3-2xf` |
| Title | Need to improve the AI assistance with CRUD with data |
| Type | `feature` |
| Completed | `2026-10-05` |

## What was delivered

Create-tool resolution now prefers the library kind named in the user message over a mismatched first `create_*` call, so product requests no longer park tag-shaped confirms. Pending confirm rows expose a generic `displayKind` header (Product, Tag, …) and a footer with Confirm / Cancel. N-item refill prompts stay generic; counting and remainder loops still target the requested count when the create tool is unambiguous.

## Where to see it

| Surface | How |
|---------|-----|
| Staging WebOnOne | Open the header AI assistant → ask to add products / N tags |
| Staging Support | `/docs/app-preferences/ai-assistant` |
| Local | `npm run dev:webonone` + `npm run dev:ai` (+ Data) → same assistant flow |
| UI Kit showcase | Components → Confirm item list |

## Feature details

- User-message hint wins over a wrong first create tool; mismatched creates are dropped when the hint resolves.
- Confirm rows: item-type header + Confirm/Cancel footer (`Cancel` label via existing `cancelChange` i18n).
- `displayKind` derived from tool-name tokens (no hard-coded tool switches).
- Remainder prompts say “matching create tool” + schema columns; Data product create descriptions discourage tag misuse.
- Support en/si AI assistant article updated for Confirm/Cancel and type headers.

## Code and docs touched

| Root | Paths |
|------|--------|
| `ai/backend` | `extractCreateItems.ts`, `createToolDisplay.ts`, `conversation.service.ts`, tests, `package.json` test list |
| `ai/frontend` | `ConversationPage.tsx`, `ai.types.ts` |
| `ui-kit` | `ConfirmItemList.tsx`, showcase |
| `webonone-v2/frontend` | `AppAssistant.tsx` |
| `data/backend` | `capabilities.ts` create description polish |
| `support/frontend` | `content/en|si/app-preferences/ai-assistant.md` |
| `spec/0020/` | `spec.md`, `plan.md`, `development-summary.md` |

## Verification run

```bash
npm run type-check -w @webonone/ui-kit
npm run type-check -w ai-root
npm run type-check -w webonone-v2-root
npm run type-check -w data-root
npm run lint -w @webonone/ui-kit
npm run lint -w @webonone/ai-frontend
npm run lint -w @webonone/webonone-frontend
npm test -w @webonone/ai-backend
```

## Deploy

| Field | Value |
|-------|-------|
| Branch | `deploy_staging` |
| Commit message | `feedback 0020: improve AI Data CRUD confirms` |
| CI | Push runs `.github/workflows/deploy-staging.yml` |

## Support status

`staging` after successful push (`closed` remains super admin).
