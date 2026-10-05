# Feedback 0020 — Improve AI assistance with Data CRUD

| Field | Value |
|-------|-------|
| Ticket | `0020` |
| Feedback id | `pEjHjn4wL1kgoS2C3-2xf` |
| Type | `feature` |
| Title | Need to improve the AI assistance with CRUD with data |
| Reporter | noreply@webonone.com |
| Attachment | none |

## Overview

Company admins use the WebOnOne AI assistant to create and update Data library items (tags, units, attributes, products, services, spaces). Confirm rows sometimes park the wrong entity type (e.g. tag-shaped details when the user asked for a product), omit a clear type label, place Confirm/Skip outside a clear footer, and under-deliver when the user asks for N items.

## Problem / goal

**Problem:**

1. Ambiguous or weakly scored create-tool selection can park **tag** (or other) confirms when the user asked for a **product** (or another specific library kind).
2. Confirm suggestion rows do not show the item type; Confirm/Skip sit as link buttons under the body without a dedicated header/footer.
3. Asking for a list of N items (e.g. 10) sometimes parks fewer than N unique creates.
4. Implementation must stay **generic** — no `switch` on tool names such as `create_data_tag` in the AI service.

**Goal:** Prefer the create tool that matches the user’s stated library kind; show a type header and Confirm/Cancel footer on each suggestion row; park exactly N unique create suggestions when the user requests N items (2–25), using generic helpers only.

## Acceptance criteria

1. When the user clearly asks to add/create **products** (or another specific Data library kind), parked confirm rows use that kind’s create tool and field shape — not tag (or another mismatched kind) details.
2. Create-tool resolution and remainder prompts use **generic** helpers (schema tokens, `suggestCreateKeys`, area labels from tool metadata) — no AI-side switches on concrete tool names like `create_data_tag`.
3. Each pending confirm suggestion shows a **small header** with the human-readable item type (e.g. Product, Tag).
4. Each pending confirm suggestion has a **footer** containing Confirm and Cancel (Skip) actions.
5. When the user asks for N library items (N in 2–25) and the create tool is unambiguous, the assistant parks **exactly N** unique named create confirms (after unique/existing name skips, refill until N new names or tools exhausted).
6. Touched workspaces pass type-check / lint (and AI backend tests for extract/batching).

## Services affected

| Area | Change |
|------|--------|
| `ui-kit/package` | `ConfirmItemList` header (item type) + footer for Confirm/Cancel |
| `ai/backend` | Create-tool preference from user message; N-item refill; generic display kind on pending payload |
| `ai/frontend` | Pass item type into `ConfirmItemList` |
| `webonone-v2/frontend` | Same confirm row mapping in App Assistant |
| `data/backend` | Sharpen create tool descriptions if needed (peer-owned) |
| `spec/0020/` | This package |

## Out of scope

- New create tools or Data schema fields
- Website catalog assistant widget
- Changing Confirm/Skip API contracts (`confirm` / `reject`)
- Hard-coded tool-name switches in AI
- Setting Support status `closed`

## Verification

```bash
npm run type-check -w @webonone/ui-kit
npm run type-check -w ai-root
npm run type-check -w webonone-v2-root
npm run lint -w @webonone/ui-kit
npm run lint -w @webonone/ai-frontend
npm run lint -w @webonone/webonone-v2-frontend
npm test -w @webonone/ai-backend
```

Manual: `npm run dev:ai` / WebOnOne assistant → ask for 10 products → confirm list shows Product header, footer Confirm/Cancel, and 10 rows; ask for a product → not tag-shaped fields.
