---
name: ai-agent
description: >-
  AI service agent for webonone-platform. Handles ai/ frontend, backend,
  migrations — conversations, provider abstraction, guest sessions, and the
  website catalog assistant widget. Use when tasks touch ai/, the AI API, or
  website assistant embed.
---

# AI agent skill

## Scope

- `ai/frontend`, `ai/backend`, `ai/backend/migrations`
- Website widget: `website/frontend/src/features/ai/`

## Model

- Conversations are owned by an Identity user (`user_id` + NULL-safe `company_id`) or a guest (`guest_id`).
- `company_id` is optional. Super-admin and users with no company can chat.
- Provider calls use a backend-only system prompt. Client cannot override it.
- Tools are discovered from peer `GET /api/v1/internal/ai/capabilities` and invoked over versioned HTTP — never MySQL.
- AI completion is generic (`completeCreateArgs`, `pickHexColor`). Palettes, required fields, and `argCompletion` belong on the owning service — [ai-capabilities.mdc](../../rules/ai-capabilities.mdc).

## Rules

- [ai-project.mdc](../../rules/ai-project.mdc)
- [ai-capabilities.mdc](../../rules/ai-capabilities.mdc) — **required** for tools, schemas, `argCompletion`
- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc)
- [feature-store skill](../feature-store/SKILL.md)
- [form-creation skill](../form-creation/SKILL.md)
- [item-list skill](../item-list/SKILL.md)
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc)

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3020 | `ai/frontend/.env` |
| Backend | 4020 | `ai/backend/.env` |

`JWT_SECRET` must match Identity. Database: `webonone_ai`. Provider URL/key/model come from env only.

## Key paths

- Auth: `ai/backend/src/middleware/auth.ts`
- Context: `ai/backend/src/ai/requestContext.ts`
- Provider factory: `ai/backend/src/ai/providers/createAiProvider.ts`
- Tools seam: `ai/backend/src/ai/tools/registry.ts`
- Completer: `ai/backend/src/ai/tools/createDefaults.ts`
- Discovery: `ai/backend/src/ai/tools/discoverCapabilities.ts`
- Conversations: `ai/backend/src/services/conversation.service.ts`
- Website widget: `website/frontend/src/features/ai/components/CatalogAssistant.tsx`

## Verification

```bash
npm run type-check -w ai-root
npm test -w @webonone/ai-backend
npm run migrate -w ai-root
```
