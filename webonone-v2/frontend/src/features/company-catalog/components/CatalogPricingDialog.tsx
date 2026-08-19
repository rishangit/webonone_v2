import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  FormField,
  Input,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import type { CatalogGalleryKind } from '@/features/company-catalog/types/companyCatalog.types'

type CatalogPricingDialogProps = {
  open: boolean
  kind: CatalogGalleryKind
  id: string
  listPrice: number | null | undefined
  onOpenChange: (open: boolean) => void
}

function toInputValue(listPrice: number | null | undefined): string {
  if (listPrice == null) return ''
  return String(listPrice)
}

export function CatalogPricingDialog({
  open,
  kind,
  id,
  listPrice,
  onOpenChange,
}: CatalogPricingDialogProps) {
  const dispatch = useAppDispatch()
  const mutateStatus = useAppSelector((s) => s.companyCatalog.mutateStatus)
  const mutateError = useAppSelector((s) => s.companyCatalog.mutateError)
  const [value, setValue] = useState(() => toInputValue(listPrice))
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setValue(toInputValue(listPrice))
    setFieldError(null)
    setSubmitted(false)
    dispatch(companyCatalogActions.clearMutateError())
  }, [open, listPrice, dispatch])

  useEffect(() => {
    if (!submitted || mutateStatus === 'saving') return
    if (mutateError) {
      setSubmitted(false)
      return
    }
    if (mutateStatus === 'idle') {
      setSubmitted(false)
      onOpenChange(false)
    }
  }, [mutateStatus, mutateError, submitted, onOpenChange])

  function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) {
      setFieldError(null)
      setSubmitted(true)
      dispatch(companyCatalogActions.updatePricingRequested({ kind, id, listPrice: null }))
      return
    }
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setFieldError('Enter a valid price of 0 or greater')
      return
    }
    setFieldError(null)
    setSubmitted(true)
    dispatch(companyCatalogActions.updatePricingRequested({ kind, id, listPrice: parsed }))
  }

  const busy = mutateStatus === 'saving'

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="List price"
      description="Company selling price used as the Point of Sale default. Leave empty to set at checkout."
      sizeWidth="small"
      sizeHeight="small"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={busy}>
            Save
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {mutateError ? (
          <Alert variant="destructive">
            <AlertDescription>{mutateError}</AlertDescription>
          </Alert>
        ) : null}
        <FormField label="List price (LKR)" htmlFor="catalog-list-price" error={fieldError ?? undefined}>
          <Input
            id="catalog-list-price"
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={busy}
          />
        </FormField>
      </div>
    </CustomDialog>
  )
}
