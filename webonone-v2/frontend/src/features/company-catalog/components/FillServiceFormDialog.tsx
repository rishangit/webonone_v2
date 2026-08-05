import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@webonone/ui-kit'
import { buildDesignFillShellPath } from '@/features/design/utils/designConfig'
import { identityCustomersApi, type IdentityCustomerOption } from '@/features/company-catalog/services/identityCustomersApi'

type FillServiceFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  formTemplateId: string
  serviceId: string
  serviceName: string
}

export function FillServiceFormDialog({
  open,
  onOpenChange,
  formTemplateId,
  serviceId,
  serviceName,
}: FillServiceFormDialogProps) {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<IdentityCustomerOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedUserId('')
    setError(null)
    let cancelled = false
    setLoading(true)
    identityCustomersApi
      .list()
      .then((items) => {
        if (!cancelled) setCustomers(items)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load customers')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  function handleContinue() {
    const customer = customers.find((c) => c.id === selectedUserId)
    if (!customer) return
    const path = buildDesignFillShellPath(formTemplateId, {
      subjectUserId: customer.id,
      subjectDisplayName: customer.displayName,
      subjectEmail: customer.email,
      serviceId,
      serviceName,
    })
    onOpenChange(false)
    navigate(path)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Fill form for customer"
      description={`Select a customer for ${serviceName}.`}
      sizeWidth="medium"
      sizeHeight="medium"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!selectedUserId} onClick={handleContinue}>
            Continue
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Select value={selectedUserId || undefined} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.displayName}
                  {customer.email ? ` (${customer.email})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {customers.length === 0 && !error ? (
            <p className="text-sm text-muted-foreground">No customers found for this company.</p>
          ) : null}
        </div>
      )}
    </CustomDialog>
  )
}
