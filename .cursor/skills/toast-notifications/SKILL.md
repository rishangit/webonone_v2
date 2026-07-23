---
name: toast-notifications
description: >-
  Wires UI Kit useToast / ToastProvider for mutation API success and failure
  feedback across service frontends. Use when adding or editing create/update/
  delete/send flows, dialog submit results, epic status toasts, or replacing
  page Alerts for mutation outcomes. Soft API warnings stay silent.
---

# Toast notifications

Standard workflow for **mutation API feedback** (create, update, delete, add, send, queue). Success and hard failures use **`useToast`** from `@webonone/ui-kit`. Soft/non-blocking warning codes from the API are **not** shown.

Rule: [toast-notifications.mdc](../../rules/toast-notifications.mdc). Kit consumption: [ui-kit-consumption.mdc](../../rules/ui-kit-consumption.mdc). Field errors stay on forms: [form-creation](../form-creation/SKILL.md).

## When to apply

- Adding or editing a mutation (POST/PATCH/PUT/DELETE) that the user triggers
- Closing a dialog after a successful write and needing confirmation
- Replacing page-level success or “with warnings” Alerts after a successful HTTP response
- Wiring Redux epic / store status transitions to one-shot toasts

## When not to use toast

| Situation | Use instead |
|-----------|-------------|
| Field / Zod validation | Inline `FormField` errors |
| Auth or multi-step form banner errors that stay on the form | `Alert` on the form |
| Persistent page / list load failure | Page `Alert` |
| Soft API warnings (`invite_delivery_failed`, `invite_email_failed`, `invite_sms_failed`, …) | Ignore — do not toast or Alert |

## UI Kit primitives (required)

| Export | Role |
|--------|------|
| `ToastProvider` | Once at service `App.tsx` root |
| `useToast` | `const { toast } = useToast()` in the component that owns the mutation outcome |
| `Toast` type | `{ title, description?, variant?: 'default' \| 'destructive' }` |

Do not hand-roll fixed toast markup. Do not nest a second `ToastProvider` around a page or dialog.

## Wiring checklist

1. Confirm `ToastProvider` wraps the router/app tree in `<service>/frontend/src/app/App.tsx`.
2. Import `useToast` from `@webonone/ui-kit` in the page or dialog that handles the mutation result.
3. On HTTP success → `toast({ title: '<Entity> <verb>' })` (e.g. `'User added'`, `'Template saved'`).
4. On HTTP failure → `toast({ title: 'Failed to …', description: message, variant: 'destructive' })`.
5. If the API returns `warnings?: string[]` on success, **ignore** them in the UI (backend may keep returning them).
6. Keep list/page load errors as `Alert`.

## Copy guidelines

- Prefer a short **title**; put details in optional `description`.
- Do not put raw codes (`invite_delivery_failed`) in title or description.
- Prefer user-facing messages from `Error.message` when the API already returns them.

## Imperative mutation (try/catch)

```tsx
const { toast } = useToast()

try {
  await addCompanyCustomer({ companyId, userId: user.id })
  toast({ title: 'User added' })
  // refresh list…
} catch (err) {
  toast({
    title: 'Failed to add user',
    description: err instanceof Error ? err.message : undefined,
    variant: 'destructive',
  })
}
```

Reference: `identity/frontend/src/features/users/pages/UsersPage.tsx`.

## Store / epic status transition (toast once)

When success/fail is driven by Redux status, fire toast on the transition — not on every render:

```tsx
const lastStatus = useRef(status)

useEffect(() => {
  if (lastStatus.current === 'saving' && status === 'idle' && !error) {
    toast({ title: 'Saved' })
  }
  if (error) {
    toast({ title: 'Save failed', description: error, variant: 'destructive' })
  }
  lastStatus.current = status
}, [status, error, toast])
```

Reference pattern: `email/frontend/src/features/test/pages/TestPage.tsx` (prefer app-root `ToastProvider`, not a page-local wrap).

## Workflow

1. **Provider** — ensure app-root `ToastProvider`.
2. **Success path** — toast with short title; close dialog if applicable; refresh list/detail.
3. **Fail path** — destructive toast; leave dialog open when the user can retry.
4. **Soft warnings** — drop from UI state and callbacks; keep API types if the contract still returns them.
5. **Verify** — type-check; manual success toast and fail toast; confirm no “with warnings” Alert.

## Checklist

- [ ] `ToastProvider` at app root (not per page)
- [ ] Mutation success uses `toast({ title })`
- [ ] Mutation fail uses `variant: 'destructive'`
- [ ] Soft `warnings` not shown
- [ ] Field errors still inline; list load errors still `Alert`
- [ ] No hand-rolled toast DOM

## Verification

From the service frontend workspace:

```bash
npm run type-check
npm run lint
```

**Manual**

- Successful mutation → default toast only
- Failed mutation → destructive toast
- Soft warnings on success → no Alert / no warning toast

Showcase demo: `ui-kit/showcase/src/pages/ComponentsPage.tsx` (Toast section).
