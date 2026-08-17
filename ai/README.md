# AI service

Standalone WebOnOne AI microservice. Conversations call a configured provider. Tools are discovered from each microservice (`GET /api/v1/internal/ai/capabilities`) and run over versioned HTTP. Writes wait for Confirm in chat.

| Layer | Port | Env |
|-------|------|-----|
| Frontend | 3020 | `ai/frontend/.env` |
| Backend | 4020 | `ai/backend/.env` |

Database: `webonone_ai`

## Local development

1. Copy env files:

```bash
copy ai\backend\.env.example ai\backend\.env
copy ai\frontend\.env.example ai\frontend\.env
```

2. Use the same `JWT_SECRET` as Identity (`identity/backend/.env`).
3. Create MySQL database `webonone_ai`.
4. Migrate and start:

```bash
npm run migrate:ai
npm run dev:ai
```

5. **Signed-in chat:** each user saves their own Ollama Cloud API key in WebOnOne **Settings → Basic Settings → AI** ([ollama.com/settings/keys](https://ollama.com/settings/keys)).
6. **Website guests:** super-admin sets the guest provider in the same AI tab (**Website guest assistant** card), or leave `AI_*` env as bootstrap fallback.

Health: `http://127.0.0.1:4020/api/v1/health`

Standalone UI: `http://127.0.0.1:3020` (Identity login; all roles, including super-admin and users with no company).

Website catalog search (`http://127.0.0.1:3018`) shows a guest-capable assistant widget (bottom-right). WebOnOne (`http://127.0.0.1:3010`) shows a signed-in assistant on the bottom-left after login. Add `VITE_AI_ORIGIN` and `VITE_AI_API_BASE_URL` to each consumer frontend `.env`.

## Auth

- Identity JWT (`iss=webonone-identity`, `aud=webonone-api`) for signed-in users.
- Guest JWT from `POST /api/v1/guest-sessions` (`iss=webonone-ai`) for website visitors. This is not a second login product.
- `company_id` is optional. Never taken from the request body.

## Provider config

| Who | Source |
|-----|--------|
| Signed-in user | `ai_provider_settings` row (`scope=user`) via WebOnOne Basic Settings → AI |
| Website guest | Super-admin platform row (`scope=platform`) or `AI_*` env bootstrap |
| System prompt | `DEFAULT_SYSTEM_PROMPT` in code; optional guest extra prompt on platform row only |

Per-user and platform API keys are encrypted at rest (`AI_CREDENTIALS_ENCRYPTION_KEY`). Never returned from GET APIs.

### Env (guest bootstrap + ops)

| Variable | Purpose |
|----------|---------|
| `AI_PROVIDER` | `ollama` (implemented) / `openai` / `gemini` / `anthropic` (stubs) |
| `AI_MODEL` | Model name when no platform DB row |
| `AI_PROVIDER_BASE_URL` | Provider origin (no trailing path) |
| `AI_PROVIDER_API_KEY` | Guest bootstrap secret; empty for local Ollama |
| `AI_CREDENTIALS_ENCRYPTION_KEY` | 32-byte hex or base64 — encrypts stored user/platform keys |
| `AI_SYSTEM_PROMPT` | Optional override of default system prompt |
| `AI_GUEST_*` | Guest JWT expiry and rate limits |
| `WEBONONE_API_BASE_URL` | WebOnOne origin for capability discovery and tool HTTP |
| `WEBONONE_SERVICE_API_KEY` | Same key as WebOnOne `WEBONONE_SERVICE_API_KEY` |
| `DATA_API_BASE_URL` | Data origin for library capability discovery and tool HTTP |
| `DATA_SERVICE_API_KEY` | Same key as Data `DATA_SERVICE_API_KEY` |

### Settings API

- `GET/PATCH /api/v1/me/ai-settings` — Identity users only
- `GET/PATCH /api/v1/admin/ai-settings` — super-admin platform guest provider

## Tests

```bash
npm test -w @webonone/ai-backend
```
