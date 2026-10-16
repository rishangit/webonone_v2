import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import {
  catalogPriceBodySchema,
  EMPTY_PRICE_FORM,
  toPriceBody,
  type CatalogPriceFormState,
} from '@/features/company-catalog/schemas/catalogPricingSchemas'
import type { CatalogPrice, CatalogPriceKind } from '@/features/company-catalog/types/catalogPricing.types'

const DIALOG_SIZE = {
  sizeWidth: 'small' as const,
  sizeHeight: 'auto' as const,
}

type CatalogPriceFormDialogProps = {
  open: boolean
  kind: CatalogPriceKind
  entityId: string
  price: CatalogPrice | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function CatalogPriceFormDialog({
  open,
  kind,
  entityId,
  price,
  onOpenChange,
  onSaved,
}: CatalogPriceFormDialogProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [values, setValues] = useState<CatalogPriceFormState>(EMPTY_PRICE_FORM)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(price ? { price: String(price.price) } : EMPTY_PRICE_FORM)
    setFieldErrors({})
    setFormError(null)
    setBusy(false)
  }, [open, price])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = catalogPriceBodySchema.safeParse(toPriceBody(values))
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setFormError(null)
    setBusy(true)
    try {
      if (price) {
        await companyCatalogApi.updatePrice(kind, entityId, price.id, parsed.data)
        toast({ title: t('priceList.priceUpdated') })
      } else {
        await companyCatalogApi.createPrice(kind, entityId, parsed.data)
        toast({ title: t('priceList.priceAdded') })
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('priceList.priceSaveFailed')
      setFormError(message)
      toast({ title: t('priceList.priceSaveFailed'), description: message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={price ? t('priceList.editPriceTitle') : t('priceList.addPriceTitle')}
      description={t('priceList.priceDialogDescription')}
      sizeWidth={DIALOG_SIZE.sizeWidth}
      sizeHeight={DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {tc('cancel')}
          </Button>
          <Button type="submit" form="catalog-price-form" className="h-10" disabled={busy}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {tc('save')}
          </Button>
        </>
      }
    >
      <Form id="catalog-price-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        <FormField label={t('priceList.price')} htmlFor="catalog-price-amount" required error={fieldErrors.price}>
          <Input
            id="catalog-price-amount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={values.price}
            onChange={(event) => setValues({ price: event.target.value })}
            disabled={busy}
          />
        </FormField>
      </Form>
    </CustomDialog>
  )
}
