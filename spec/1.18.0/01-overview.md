# 1.18.0 overview

The AI service is a standalone microservice. Users talk to WebOnOne in natural language. Phase 1 stores conversations and calls a configured provider. Phase 2 will add a Tool Registry and read-only catalog search tools.

```text
Website / AI SPA  --Bearer-->  AI API  -->  AiProvider (Ollama, …)
                         |           -->  webonone_ai (conversations)
                         v
              Identity JWT or AI guest JWT
```

## Security rules

- Authenticate every conversation API.
- Build `AiRequestContext` only from a verified token.
- Never trust identity from the model or from request body/query.
- Never give the model MySQL, SQL, JS, shell, filesystem, or arbitrary HTTP.
- Never log API keys, JWTs, passwords, DB credentials, or stack traces to clients.
- System prompt is backend-controlled.

## Phase 2 roadmap

1. Tool Registry + JSON schemas + risk levels (`read` / `write` / `destructive`).
2. First **read-only** tools: website/WebOnOne catalog search via versioned HTTP APIs.
3. Permission checks from JWT role + derived capabilities (still not from the model).
4. Optional WebOnOne shell embed of the AI UI.
