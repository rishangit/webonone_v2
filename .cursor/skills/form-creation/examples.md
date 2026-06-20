# Form creation examples

Self-contained templates for any service. Replace `<module>`, field names, and submit logic.

## Matching frontend + backend schemas

Define **the same constraints in both files**. Frontend adds user-facing messages; backend enforces the API contract.

**Backend** — `backend/src/schemas/contactSchemas.ts`:

```typescript
import { z } from 'zod'

export const contactBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  phone: z.string().max(32).optional(),
})

export type ContactBody = z.infer<typeof contactBodySchema>
```

**Frontend** — `frontend/src/features/<module>/schemas/contactSchemas.ts`:

```typescript
import { z } from 'zod'

export const contactSchema = z.object({
  email: z.string().email('Enter a valid email'),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(32).optional(),
})

export type ContactFormValues = z.infer<typeof contactSchema>
```

Compare: same fields, same `.min(1).max(100)` on `name`, same `.email()` on `email`, same optional `phone`.

## Backend route + middleware

`backend/src/routes/contact.routes.ts`:

```typescript
import { Router } from 'express'
import { validateBody } from '../middleware/validate.js'
import { contactBodySchema } from '../schemas/contactSchemas.js'
import * as contactController from '../controllers/contact.controller.js'

const router = Router()

router.post('/', validateBody(contactBodySchema), contactController.create)

export default router
```

`validateBody` returns `400` with `code: 'VALIDATION_ERROR'` when the body fails Zod parsing.

## Zod schema (frontend-only reference)
`features/<module>/schemas/contactValidation.ts`:

```typescript
import { z } from 'zod'

export const contactSchema = z.object({
  email: z.string().email('Enter a valid email'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
})

export type ContactFormValues = z.infer<typeof contactSchema>
```

## Minimal form (two required fields)

`features/<module>/components/ContactForm.tsx`:

```typescript
import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  Spinner,
} from '@webonone/ui-kit'
import { contactSchema, type ContactFormValues } from '@/features/<module>/schemas/contactValidation'

interface ContactFormProps {
  error?: string | null
  isLoading?: boolean
  onSubmit: (values: ContactFormValues) => void
}

export function ContactForm({ error, isLoading = false, onSubmit }: ContactFormProps) {
  const [values, setValues] = useState<ContactFormValues>({ email: '', name: '', phone: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ContactFormValues, string>>>(
    {},
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = contactSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSubmit(parsed.data)
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label="Name" htmlFor="name" required error={fieldErrors.name}>
        <Input
          autoComplete="name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        />
      </FormField>
      <FormField label="Email" htmlFor="email" required error={fieldErrors.email}>
        <Input
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" /> : 'Submit'}
      </Button>
    </Form>
  )
}
```

## Multi-field form (required + optional)

Add an optional field — omit `required` on `FormField` and use `.optional()` in Zod:

```typescript
<FormField label="Phone" htmlFor="phone" error={fieldErrors.phone}>
  <Input
    type="tel"
    autoComplete="tel"
    value={values.phone ?? ''}
    onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
  />
</FormField>
```

## Submit handler with Redux (optional)

When the form dispatches to a slice instead of a callback prop:

```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  const parsed = contactSchema.safeParse(values)
  if (!parsed.success) {
    setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
    return
  }
  setFieldErrors({})
  dispatch(authActions.clearAuthError())
  dispatch(authActions.loginRequested(parsed.data))
}
```

See [redux-store-and-epics.mdc](../../rules/redux-store-and-epics.mdc) for slice/epic conventions.

## Grid layout for side-by-side fields

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <FormField label="First name" htmlFor="firstName" required error={fieldErrors.firstName}>
    <Input
      autoComplete="given-name"
      value={values.firstName}
      onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
    />
  </FormField>
  <FormField label="Last name" htmlFor="lastName" required error={fieldErrors.lastName}>
    <Input
      autoComplete="family-name"
      value={values.lastName}
      onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
    />
  </FormField>
</div>
```
