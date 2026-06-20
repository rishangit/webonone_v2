---
name: form-creation
description: >-
  Creates React forms with matching Zod validation on frontend and backend,
  required-field asterisks, and inline field errors using @webonone/ui-kit.
  Use when adding or editing forms, form fields, Zod schemas, API body validation,
  validateBody middleware, FormField, validation messages, or required indicators
  in any service frontend or backend that handles the same user input.
---

# Form creation

Standard workflow for forms that submit to the **same service's API**. Validate on **both** frontend (UX) and backend (security) with **matching Zod rules**.

## When to apply

- Adding or editing a form component
- Adding Zod schemas for user input (frontend or backend)
- Wiring validation errors or required-field indicators
- Adding or changing API routes that accept form payloads

## Validation approach

| Layer | Role | Mechanism |
|-------|------|-----------|
| **Frontend** | Immediate UX; block bad submits | Controlled `useState` + `safeParse` on submit — not react-hook-form |
| **Backend** | Authoritative; never trust the client | `validateBody(schema)` middleware or `schema.safeParse` in the handler |

Both layers must enforce the **same fields and constraints** (`.min`, `.max`, `.email`, `.refine`, optional/nullable). Frontend adds user-facing error strings; backend may omit message text but must not relax rules.

## File layout

Per service — frontend and backend each own schemas in parallel paths:

```text
<service>/
  frontend/src/features/<module>/
    schemas/<domain>Schemas.ts      # Zod + user-facing messages + z.infer types
    components/<Feature>Form.tsx
  backend/src/
    schemas/<domain>Schemas.ts      # Same Zod constraints (API source of truth)
    middleware/validate.ts          # validateBody helper
    routes/…                        # wire validateBody on POST/PATCH routes
    controllers/…                   # use parsed req.body only
```

- Frontend schemas: [front-end-structure.mdc](../../rules/front-end-structure.mdc)
- Backend schemas: [nodejs-express.mdc](../../rules/nodejs-express.mdc)
- Do not copy UI Kit components into service apps
- Do not import backend code into frontend or vice versa — **duplicate the Zod shape in both files and keep them in sync** in the same PR

## Frontend + backend parity

When a form POSTs/PATCHes to its own service API:

1. **Define backend schema first** (or update both together) in `backend/src/schemas/<domain>Schemas.ts`.
2. **Mirror constraints** in `frontend/src/features/<module>/schemas/<domain>Schemas.ts` with the same field names and rules.
3. **Frontend messages** — add copy in Zod (e.g. `'Email is required'`). Backend messages are optional; use generic API errors if omitted.
4. **Route** — attach `validateBody(schema)` before the controller (preferred) or `safeParse` at the top of the handler.
5. **Never skip backend validation** because the frontend already validated.

### Parity checklist (compare both schema files)

- [ ] Same top-level field names
- [ ] Same required vs optional vs nullable
- [ ] Same string length limits and `.email()` / `.url()` / custom `.refine()` rules
- [ ] Same numeric min/max where applicable

## UI Kit changes

If the task needs new `FormField` behavior or kit exports, change **`ui-kit/` first** (ui-kit-agent scope), build the package, then update the service frontend.

## Frontend workflow

1. **Schema** — Zod object in `features/<module>/schemas/`. Export `type FormValues = z.infer<typeof schema>`.
2. **Messages** — User-facing copy in the schema (e.g. `'Email is required'`, `'Enter a valid email'`).
3. **Required in Zod** — `.min(1, '… is required')`, `.email()`, etc.
4. **Form state** — `useState<FormValues>` + `useState<Partial<Record<keyof FormValues, string>>>({})` for `fieldErrors`.
5. **Submit** — `schema.safeParse(values)` → `mapZodIssuesToFieldErrors` → `setFieldErrors`; on success dispatch / API call.
6. **Render** — `Form` → `FormField` → `Input` from `@webonone/ui-kit`.

## Backend workflow

1. **Schema** — Export from `backend/src/schemas/<domain>Schemas.ts` with **identical constraints** to the frontend schema.
2. **Middleware** — Use `validateBody(schema)` from `middleware/validate.ts` on the route, or `safeParse` in the controller.
3. **Response** — On failure return `400` with `{ message: 'Validation failed', code: 'VALIDATION_ERROR', details }` (see existing `validateBody`).
4. **Handler** — Use only parsed data (`req.body` after middleware, or `parsed.data`).

## Required fields (frontend UI)

- Set `required` on `FormField` for every field Zod treats as required.
- Omit `required` on optional fields.
- `FormField` renders a red `*` and sets `aria-required` on the control.

## Error display (frontend)

| Error type | Where |
|------------|-------|
| Field validation (client) | `FormField error={fieldErrors.fieldName}` — directly under the input |
| API / form-level | Top of form: `Alert variant="destructive"` with `AlertDescription` |

Client validation runs **on submit**. Clear `fieldErrors` when client validation passes. Backend may still return `400` — show that in the form-level alert.

## Accessibility

- Pair `FormField htmlFor` with control `id` (FormField sets `id` on a single child via clone).
- Required: `FormField required` (sets `aria-required`).
- Invalid: `FormField error` sets `aria-invalid` and `aria-describedby` on the control.
- Use UI Kit / Radix primitives ([react-typescript.mdc](../../rules/react-typescript.mdc)).

## Imports

**Frontend:**

```typescript
import { Form, FormField, Input, Button, Alert, AlertDescription, mapZodIssuesToFieldErrors } from '@webonone/ui-kit'
import { mySchema, type MyFormValues } from '@/features/<module>/schemas/mySchemas'
```

**Backend:**

```typescript
import { validateBody } from '../middleware/validate.js'
import { myBodySchema } from '../schemas/mySchemas.js'
```

Use `@/` on frontend ([code-cleanliness.mdc](../../rules/code-cleanliness.mdc)).

## Checklist

**Schemas (both layers)**

- [ ] Backend Zod schema in `backend/src/schemas/`
- [ ] Frontend Zod schema with matching constraints + user-facing messages
- [ ] Both updated in the same change when rules change

**Frontend**

- [ ] `FormField required` matches Zod-required fields
- [ ] `FormField error={fieldErrors.<field>}` on every validated field
- [ ] Submit uses `safeParse` + `mapZodIssuesToFieldErrors`
- [ ] API errors in `Alert variant="destructive"` when applicable
- [ ] Submit button respects loading/disabled state

**Backend**

- [ ] Route uses `validateBody(schema)` or equivalent `safeParse`
- [ ] Controller never trusts unvalidated `req.body`
- [ ] Validation failures return `400` / `VALIDATION_ERROR`

**Security**

- [ ] No secrets or tokens in form URLs or client-exposed hidden fields

## Rules

Cross-link only — do not duplicate:

- [front-end-structure.mdc](../../rules/front-end-structure.mdc) — feature folders, schema placement
- [react-typescript.mdc](../../rules/react-typescript.mdc) — components, TypeScript, a11y
- [tailwind-css.mdc](../../rules/tailwind-css.mdc) — utility styling
- [code-cleanliness.mdc](../../rules/code-cleanliness.mdc) — `@/` imports, dead code
- [ui-kit-project.mdc](../../rules/ui-kit-project.mdc) — kit build and export workflow
- [nodejs-express.mdc](../../rules/nodejs-express.mdc) — REST handlers, backend validation

## Examples

Full copy-paste templates: [examples.md](examples.md)

## Verification

**UI Kit** (when changing `FormField` or exports):

```bash
npm run build -w @webonone/ui-kit
npm run type-check -w ui-kit-root
```

**Service frontend** (from that service's `frontend/` directory):

```bash
npm run type-check
npm run lint
```

**Service backend** (from that service's `backend/` directory):

```bash
npm run type-check
npm run lint
```

**Manual**

- Frontend: empty required field → `*` on label, red message under field, no submit
- Backend: send invalid JSON body (e.g. missing required field) → `400` with `VALIDATION_ERROR`
