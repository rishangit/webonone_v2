# WebOnOne Platform — Specification (1.18.0)

Phase 1 of the WebOnOne AI Assistant: an independent `ai/` microservice with Identity (and guest) chat, a provider abstraction, persistent conversations, and a minimal website widget. No business tools yet.

**Spec No:** 1.18.0

## What changed

| Area | 1.18.0 |
|------|--------|
| New service | `ai/` (FE 3020, BE 4020, DB `webonone_ai`) |
| Auth | Identity JWT for all roles including super-admin and users with no company; AI-issued guest tokens for website visitors |
| Storage | `ai_conversations` / `ai_messages` with future tool columns |
| Provider | Abstraction; Ollama implemented; OpenAI/Gemini/Anthropic stubbed |
| Website | Catalog search assistant widget |

## Projects affected

| Project | Role |
|---------|------|
| **AI** (`ai/`) | New service |
| **Website** (`website/`) | Catalog assistant widget + `VITE_AI_*` |
| Root wiring | workspaces, `dev:ai`, `env:apply` |
| Identity / WebOnOne | No domain changes |

## Documents

| Doc | Topic |
|-----|-------|
| [01-overview.md](./01-overview.md) | Architecture, security, Phase 2 |
| [02-auth-and-tenant.md](./02-auth-and-tenant.md) | Identity vs guest, isolation |
| [03-conversations-and-apis.md](./03-conversations-and-apis.md) | Schema and APIs |
| [04-provider-and-local-dev.md](./04-provider-and-local-dev.md) | Env, Ollama, commands |

## Revision history

- **2026-08-16** — Phase 1 AI foundation.
