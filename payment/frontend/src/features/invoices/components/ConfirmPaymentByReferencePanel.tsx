import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  StatusTag,
} from '@webonone/ui-kit'
import { paymentApi } from '@/shared/services/paymentApi'
import type { InvoiceDetail, InvoiceStatus } from '@/shared/types/payment.types'
import { formatDate, formatLkr, formatPeriod } from '@/shared/utils/money'

function statusVariant(status: InvoiceStatus): 'pending' | 'approved' | 'rejected' {
  if (status === 'paid') return 'approved'
  if (status === 'overdue' || status === 'void') return 'rejected'
  return 'pending'
}

function statusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'issued':
      return 'Issued'
    case 'paid':
      return 'Paid'
    case 'overdue':
      return 'Overdue'
    case 'void':
      return 'Void'
    case 'pending_verification':
      return 'Pending review'
    default:
      return status
  }
}

type ConfirmPaymentByReferencePanelProps = {
  onConfirmed: () => void
}

export function ConfirmPaymentByReferencePanel({ onConfirmed }: ConfirmPaymentByReferencePanelProps) {
  const [reference, setReference] = useState('')
  const [lookup, setLookup] = useState<InvoiceDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleLookup() {
    setError(null)
    setLookup(null)
    const value = reference.trim()
    if (!value) {
      setError('Enter a payment reference')
      return
    }
    setBusy(true)
    try {
      const invoice = await paymentApi.getInvoiceByReference(value)
      setLookup(invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invoice not found for that reference')
    } finally {
      setBusy(false)
    }
  }

  async function handleMarkPaid() {
    if (!lookup) return
    setError(null)
    setBusy(true)
    try {
      const invoice = await paymentApi.markPaidByReference(lookup.paymentReference)
      setLookup(invoice)
      onConfirmed()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark paid')
    } finally {
      setBusy(false)
    }
  }

  const canMarkPaid = lookup && (lookup.status === 'issued' || lookup.status === 'overdue')

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">Confirm payment by reference</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <FormField
            label="Invoice reference number"
            htmlFor="confirm-payment-reference"
            className="min-w-0 flex-1"
          >
            <Input
              id="confirm-payment-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value.toUpperCase())}
              placeholder="WO-2026-000001"
              autoComplete="off"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleLookup()
                }
              }}
            />
          </FormField>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void handleLookup()}>
            Look up
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {lookup ? (
          <div className="space-y-3 rounded-md border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{lookup.companyName}</span>
              <StatusTag variant={statusVariant(lookup.status)}>
                {statusLabel(lookup.status)}
              </StatusTag>
            </div>
            <p className="text-muted-foreground">
              {lookup.invoiceNumber} · Ref {lookup.paymentReference}
            </p>
            <p>
              {formatLkr(lookup.amountMinor)} · {formatPeriod(lookup.periodStart, lookup.periodEnd)} ·
              Due {formatDate(lookup.dueAt)}
            </p>
            {canMarkPaid ? (
              <Button type="button" disabled={busy} onClick={() => void handleMarkPaid()}>
                Mark paid
              </Button>
            ) : (
              <p className="text-muted-foreground">
                {lookup.status === 'paid'
                  ? 'This invoice is already paid.'
                  : 'This invoice cannot be marked paid.'}
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
