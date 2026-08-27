import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusTag,
  Textarea,
  useToast,
} from '@webonone/ui-kit'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { PosCartList } from '@/features/sales/components/PosCartList'
import { completeSaleBodySchema } from '@/features/sales/schemas/salesSchemas'
import { salesApi } from '@/features/sales/services/salesApi'
import type { PosCartLine, Sale, SalePaymentMethod, TokenPosSubject } from '@/features/sales/types/sales.types'
import { formatLkr } from '@/features/sales/utils/formatMoney'

type TokenBillDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: TokenPosSubject
  onSaleCompleted?: () => void
}

function saleToCartLines(sale: Sale): PosCartLine[] {
  return sale.lines.map((line) => ({
    key: line.id,
    itemKind: line.itemKind,
    catalogItemId: line.catalogItemId,
    name: line.name,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
  }))
}

export function TokenBillDialog({
  open,
  onOpenChange,
  token,
  onSaleCompleted,
}: TokenBillDialogProps) {
  const { t } = useTranslation('sales')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()

  const [bill, setBill] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('cash')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const completingRef = useRef(false)

  const isPaid = bill?.status === 'completed'
  const isDraft = bill?.status === 'draft'

  usePlatformLoading(loading ? t('bill.loading') : saving ? t('tokenBill.closing') : null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setFormError(null)
    setPaymentMethod('cash')
    setNotes('')
    setLoading(true)
    salesApi
      .getSessionTokenBill(token.id)
      .then((sale) => {
        if (!cancelled) setBill(sale)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, token.id])

  const lines = bill ? saleToCartLines(bill) : []
  const total = bill?.total ?? 0

  async function handleCloseSale() {
    if (!bill || !isDraft || completingRef.current) return
    const body = {
      paymentMethod,
      notes: notes.trim() || null,
    }
    const parsed = completeSaleBodySchema.safeParse(body)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t('pos.validationFailed'))
      return
    }
    setFormError(null)
    completingRef.current = true
    setSaving(true)
    try {
      const completed = await salesApi.completeSale(bill.id, parsed.data)
      setBill(completed)
      toast({ title: t('tokenBill.closed') })
      onSaleCompleted?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined
      if (message?.includes('Only draft sales can be completed')) {
        const refreshed = await salesApi.getSessionTokenBill(token.id)
        if (refreshed?.status === 'completed') {
          setBill(refreshed)
          toast({ title: t('tokenBill.closed') })
          onSaleCompleted?.()
          return
        }
      }
      toast({
        title: t('tokenBill.closeFailed'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      completingRef.current = false
      setSaving(false)
    }
  }

  const customerLabel = token.tokenLabel
    ? t('tokenPos.customerWithToken', {
        name: token.userDisplayName,
        token: token.tokenLabel,
      })
    : t('tokenPos.customer', { name: token.userDisplayName })

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('tokenBill.dialogTitle')}
      description={customerLabel}
      sizeWidth="large"
      sizeHeight="large"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isPaid ? (
            <Button
              type="button"
              className="h-10"
              disabled={saving || loading}
              onClick={() => onOpenChange(false)}
            >
              {tc('close')}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
                disabled={saving || loading}
                onClick={() => onOpenChange(false)}
              >
                {tc('cancel')}
              </Button>
              <Button
                type="button"
                className="h-10"
                disabled={saving || loading || !bill || lines.length === 0}
                onClick={() => void handleCloseSale()}
              >
                {t('tokenBill.closeSale')}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        {loading ? null : !bill || lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('tokenBill.empty')}</p>
        ) : (
          <>
            {isPaid ? (
              <div className="flex flex-wrap items-center gap-2">
                <StatusTag variant="verified">{t('tokenBill.paid')}</StatusTag>
                {bill.billNumber ? (
                  <span className="text-sm text-muted-foreground">
                    {t('tokenBill.billNumber')}: {bill.billNumber}
                  </span>
                ) : null}
              </div>
            ) : null}
            <PosCartList lines={lines} readOnly />
            <p className="text-lg font-semibold">{t('pos.total', { amount: formatLkr(total) })}</p>
            {isPaid ? (
              <div className="space-y-2 text-sm">
                {bill.paymentMethod ? (
                  <p className="text-muted-foreground">
                    {t('pos.paymentMethod')}: {t(`payment.${bill.paymentMethod}`)}
                  </p>
                ) : null}
                {bill.notes ? (
                  <p className="text-muted-foreground">
                    {t('pos.notes')}: {bill.notes}
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                <FormField label={t('pos.paymentMethod')} htmlFor={`token-bill-payment-${token.id}`} required>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as SalePaymentMethod)}
                  >
                    <SelectTrigger id={`token-bill-payment-${token.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t('payment.cash')}</SelectItem>
                      <SelectItem value="card">{t('payment.card')}</SelectItem>
                      <SelectItem value="other">{t('payment.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={t('pos.notes')} htmlFor={`token-bill-notes-${token.id}`}>
                  <Textarea
                    id={`token-bill-notes-${token.id}`}
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </FormField>
              </>
            )}
          </>
        )}
      </div>
    </CustomDialog>
  )
}
