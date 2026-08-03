---
name: design-agent
description: >-
  Design service agent for webonone-platform. Handles design/ frontend, backend,
  migrations — company form templates and visual form designer (toolbox + canvas).
  Use when tasks touch design/, Design API, WebOnOne Design nav, or Design
  create/edit dialog boxes — also read core-hosted-peer-dialog and dialog-windows
  for any dialog or modal.
---

# Design agent skill

## Scope

- `design/frontend`, `design/backend`, `design/backend/migrations`
- WebOnOne consumer: `webonone-v2/frontend/src/features/design/` + peer frame wiring (parent agent / webonone-agent)

## Model

- **Form templates** are company-scoped (`design_form_templates.company_id` from JWT).
- **Definition JSON v1:** `{ version: 1, fields: [{ id, type, label, required?, placeholder?, options? }] }`
- **Field types:** `text` | `textarea` | `checkbox` | `radio` | `select`
- **Designer:** toolbox click appends a field; canvas selects; props panel edits label/options/order.
- **MVP:** designer + CRUD only — no fill UI, no documents table, no session-token attach.

## Rules

- [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) — pages dispatch actions only
- [feature-store skill](../feature-store/SKILL.md) — catalog CRUD via `@webonone/store-kit`
- [form-creation skill](../form-creation/SKILL.md) — matching Zod validation FE + BE
- [item-list skill](../item-list/SKILL.md) — forms list rows
- [platform-shell-navigation.mdc](../../rules/platform-shell-navigation.mdc) — embed in WebOnOne
- [dialog-windows.mdc](../../rules/dialog-windows.mdc) — CustomDialog; peer-dialog chrome split
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports

## Ports and env

| Layer | Port | Env file |
|-------|------|----------|
| Frontend | 3019 | `design/frontend/.env` |
| Backend | 4019 | `design/backend/.env` |

`JWT_SECRET` must match Identity backend. Database: `webonone_design`.

## Core-hosted form dialogs

Create-form dialog uses **peer-dialog** when embedded: host owns sizes/header/footer; `/embed/dialogs/forms/create` is body-only.

**Follow:** [core-hosted-peer-dialog skill](../core-hosted-peer-dialog/SKILL.md)

Reference: `design/frontend/src/features/forms/components/FormCreateDialog.tsx`, `…/pages/FormCreateEmbedPage.tsx`.

## Key paths

- Migrations: `design/backend/migrations/`
- Forms API: `design/backend/src/routes/forms.routes.ts`, `…/services/form.service.ts`
- Schemas: `design/backend/src/schemas/formSchemas.ts`
- List: `design/frontend/src/features/forms/pages/FormsPage.tsx`
- Designer: `design/frontend/src/features/forms/pages/FormDesignerPage.tsx`
- Store: `design/frontend/src/features/forms/store/formsStore.ts`

## Verification

```bash
npm run type-check -w design-root
npm run migrate -w design-root
npm run build -w design-root
```
