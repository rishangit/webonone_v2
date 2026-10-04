# Feedback 0001 — AI Assistant Capabilities Support Document

| Field | Value |
|-------|-------|
| Ticket | `0001` |
| Feedback id | `pdx0Lzc7DwAGY5JTB8B_y` |
| Type | `feature` |
| Title | AI Assistant Capabilities Support Document |
| Reporter | n.rishee@gmail.com |
| Attachment | none |

## Overview

Users need a Support help article that explains what the in-app AI assistant can do and which platform areas expose tooling (list / create / update / delete and related operations). The product already surfaces a **What the assistant can do** card under **Basic Settings → AI**; public help must match that story in English and Sinhala.

## Problem / goal

Today `support/frontend/src/content/{en,si}/app-preferences/ai-assistant.md` only briefly mentions the capabilities card. Users cannot learn from help which tooling areas exist (company catalog, Data library, events, staff, companies, payment invoices, SMS templates, public catalog) or how confirms and company session affect available tools.

**Goal:** Update Support documentation so a signed-in user can understand AI assistant capabilities and tooling areas without reading internal rules or API docs.

## Acceptance criteria

1. English and Sinhala help articles under `app-preferences` document AI assistant capabilities and tooling areas (expand `ai-assistant` and/or add a sibling article with cross-links).
2. Docs explain how to open the assistant, the need for an API key, and that writes require **Confirm** in chat.
3. Docs describe the **What the assistant can do** card (Basic Settings → AI) and that the list depends on role, company session, and permissions.
4. Docs list the main tooling areas in user language (aligned with WebOnOne `ai.supportedAreas.areas.*` copy): public catalog, company catalog, calendar/events, staff, staff leave, companies/registration, Data library (tags, units, attributes, products, services, spaces), Payment invoices, SMS templates — noting areas may appear only when tools are available for the account.
5. Docs distinguish the chat assistant from field-level sparkle polish and from the public website guest catalog assistant.
6. Related articles (`ai-api-key`, `signed-in-ai`, `field-ai-polish`, `guest-assistant`) link to the capabilities content where useful.
7. No product UI/API changes required for this ticket (docs-only MVP).
8. `npm run type-check -w support-root` passes after the content change.

## Services affected

| Service | Change |
|---------|--------|
| `support/` | Markdown help articles (`en` + `si`) |

## Out of scope

- Changing WebOnOne `AiSupportedAreasCard` or AI backend capability discovery
- Documenting internal tool names, schemas, or `argCompletion`
- Desktop / mobile shell changes
- Sinhala translation of every product UI string beyond the help article body
- Setting Support status `staging` or `closed`

## Verification

```bash
npm run type-check -w support-root
npm run lint -w @webonone/support-frontend
```

Manual (optional): open `http://127.0.0.1:3021/docs/app-preferences/ai-assistant` (and any new sibling slug) in `en` and `si`.
