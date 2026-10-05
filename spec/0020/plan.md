# Plan — Feedback 0020

## Approach

Improve Data CRUD assistance in three layers: (1) generic create-tool resolution so product requests do not lock onto tag creates, (2) N-item refill until unique **new** create count matches the request (including after existing-name skips), (3) ConfirmItemList UI with item-type header and Confirm/Cancel footer. Keep AI completion generic; peer Data descriptions may clarify product vs tag for the model.

## Implementation steps

1. **Create-tool resolution (`ai/backend`)**
   - Prefer `pickCreateToolFromHint(userMessage)` over “first `create_*` call in the turn” when the user message clearly scores a specific library kind.
   - Only fall back to the existing call’s tool when the user message is ambiguous (tie / zero score).
   - Keep scoring on tool-name tokens + message text — no `switch (tool.name)`.
   - Make `remainingCreateCallsPrompt` refer to the selected tool generically (schema columns / “the matching create tool”) rather than embedding a concrete name if that conflicts with the generic-terms requirement; prefer describing columns via `suggestCreateKeys`.

2. **N-item parking (`extractCreateItems` + `conversation.service`)**
   - Tighten `requestedItemCount` if needed for common phrasings (“add 10 products to the library”).
   - Ensure the refill loop continues until `uniqueCreateNameCount === requested` or provider rounds exhaust.
   - **Existing-name refill:** before parking, look up `uniqueLookup` values, `dropCreateCallsWithExistingNames`, then table-refill with `alsoAvoidNames` until N **new** names or `MAX_EXISTING_NAME_REFILLS`.
   - Add/extend unit + app tests: product request does not park tag tool; “10 products” parks 10 when unambiguous; avoid-existing prompt does not shrink remaining count.

3. **Display kind on pending payload**
   - Derive a human label from tool metadata (e.g. area resource from `summarizeToolAreas` / token after `create_`, title-cased) — generic helper, no tool-name switch table of all Data tools.
   - Attach `displayKind` (or `itemTypeLabel`) on each `PendingToolCall` and top-level pending payload.

4. **UI Kit `ConfirmItemList`**
   - Add optional `itemTypeLabel?: string` on `ConfirmListItem`.
   - Pending row layout: small **header** (muted/small type label), body (fields + related tree), **footer** bar with Confirm + Cancel (`skipLabel`).
   - Update showcase demo briefly.

5. **Consumers**
   - `ai/frontend` ConversationPage and `webonone-v2` AppAssistant: map `call.displayKind` / fallback from call name via shared generic formatter if backend omits it.
   - i18n: Cancel label can reuse existing Skip key or add `cancel` if copy should say Cancel (feedback asks for Cancel — use Cancel in en/si where assistant confirm lives).

6. **Data capabilities (optional polish)**
   - Strengthen `create_data_product` / `create_data_tag` descriptions so the model prefers the right tool (peer-owned; already partially present).

7. **Verify** — type-check/lint on ui-kit, ai, webonone-v2; `npm test -w @webonone/ai-backend`.

8. **Help** — short Support note only if user-facing assistant confirm chrome is documented; otherwise skip (internal assistant UX). Prefer updating existing AI/assistant help if present.

## Status transitions

| When | Status |
|------|--------|
| Spec + this plan on disk | `planned` |
| Before product edits | `in_progress` |
| Verification passed | `developed` |
| Push to `deploy_staging` | `staging` |

## Risks / notes

- Unique/existing name skips reduce parked count intentionally; refill must request **additional** new names until N new candidates or stop after retries.
- Ambiguous “items” with both tag and product tools available may still refuse to auto-park (existing safety) — that is OK; criteria focus on **clear** product/tag wording.
- Do not hard-code Data entity labels in UI Kit; pass label from consumers/backend.
