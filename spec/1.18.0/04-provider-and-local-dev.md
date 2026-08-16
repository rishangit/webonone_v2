# Provider configuration and local development

All provider settings come from `ai/backend/.env` (see `.env.example`). Never hard-code URLs or keys.

| Variable | Notes |
|----------|-------|
| `AI_PROVIDER` | `ollama` implemented; others stub `501 PROVIDER_NOT_CONFIGURED` |
| `AI_MODEL` | e.g. `llama3.2` |
| `AI_PROVIDER_BASE_URL` | e.g. `http://127.0.0.1:11434` |
| `AI_PROVIDER_API_KEY` | empty for local Ollama |
| `AI_SYSTEM_PROMPT` | optional override |

## Commands

```bash
copy ai\backend\.env.example ai\backend\.env
copy ai\frontend\.env.example ai\frontend\.env
npm run migrate:ai
npm run dev:ai
npm test -w @webonone/ai-backend
npm run type-check -w ai-root
```

Website widget: set `VITE_AI_ORIGIN` and `VITE_AI_API_BASE_URL` in `website/frontend/.env`.
