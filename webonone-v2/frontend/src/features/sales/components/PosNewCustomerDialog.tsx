import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { identityCustomersApi } from '@/features/company-catalog/services/identityCustomersApi'
import { posNewCustomerSchema, type PosNewCustomerValues } from '@/features/sales/schemas/salesSchemas'

type PosNewCustomerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (customer: { id: string; displayName: string; email: string | null }) => void
}

const EMPTY: PosNewCustomerValues = {
  firstName: '',
  lastName: '',
  email: undefined,
  phoneNumber: '+94',
}

export function PosNewCustomerDialog({ open, onOpenChange, onCreated }: PosNewCustomerDialogProps) {
  const [values, setValues] = useState<PosNewCustomerValues>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PosNewCustomerValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(EMPTY)
    setFieldErrors({})
    setError(null)
  }, [open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = posNewCustomerSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setBusy(true)
    setError(null)
    try {
      const created = await identityCustomersApi.create({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phoneNumber: parsed.data.phoneNumber,
      })
      onCreated(created)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New customer"
      description="Create and assign a customer to this company."
      sizeWidth="medium"
      sizeHeight="medium"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="pos-new-customer-form" disabled={busy}>
            Create
          </Button>
        </div>
      }
    >
      <Form id="pos-new-customer-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <FormField label="First name" htmlFor="pos-customer-first" required error={fieldErrors.firstName}>
          <Input
            id="pos-customer-first"
            value={values.firstName}
            onChange={(e) => setValues((prev) => ({ ...prev, firstName: e.target.value }))}
            disabled={busy}
          />
        </FormField>
        <FormField label="Last name" htmlFor="pos-customer-last" required error={fieldErrors.lastName}>
          <Input
            id="pos-customer-last"
            value={values.lastName}
            onChange={(e) => setValues((prev) => ({ ...prev, lastName: e.target.value }))}
            disabled={busy}
          />
        </FormField>
        <FormField label="Email" htmlFor="pos-customer-email" error={fieldErrors.email}>
          <Input
            id="pos-customer-email"
            type="email"
            value={values.email ?? ''}
            onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
            disabled={busy}
          />
        </FormField>
        <FormField
          label="Phone"
          htmlFor="pos-customer-phone"
          required
          error={fieldErrors.phoneNumber}
        >
          <Input
            id="pos-customer-phone"
            value={values.phoneNumber}
            onChange={(e) => setValues((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            disabled={busy}
          />
        </FormField>
      </Form>
    </CustomDialog>
  )
}
