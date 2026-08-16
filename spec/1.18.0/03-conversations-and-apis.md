# Conversations, messages, and APIs

## Tables

`ai_conversations`: `id`, nullable `company_id` / `user_id` / `guest_id`, `title`, timestamps. Exactly one of `user_id` or `guest_id`.

`ai_messages`: `id`, `conversation_id`, nullable `company_id`, `role` (`user` \| `assistant` \| `system` \| `tool` \| `tool_result`), `content`, nullable `tool_name` / `tool_call_id` / `tool_payload`, `created_at`.

## APIs (`/api/v1`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | none |
| POST | `/guest-sessions` | none + rate limit |
| GET | `/me` | Identity or guest |
| POST | `/conversations` | Identity or guest |
| GET | `/conversations` | Identity or guest (paginated) |
| GET | `/conversations/:id` | owner |
| GET | `/conversations/:id/messages` | owner |
| POST | `/conversations/:id/messages` | owner |

Send: validate content → save user message → call provider with backend system prompt + history → save assistant message. If the provider fails, the user message stays and the API returns `502 PROVIDER_ERROR`.
