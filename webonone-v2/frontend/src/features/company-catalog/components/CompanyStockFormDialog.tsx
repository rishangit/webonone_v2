import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  DatePicker,
  FormField,
  Input,
  SelectUser,
  type SelectUserValue,
  UserSelectionDialog,
  type LoadUsersFn,
  type UserOption,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import {
  createEmptyStockFormDraft,
  stockFormSchema,
  toCreateStockPayload,
  type StockFormDraft,
} from '@/features/company-catalog/schemas/stockSchemas'
import {
  dataLibraryApi,
  type LibraryProductVariantStock,
} from '@/features/company-catalog/services/dataLibraryApi'
import { loadIdentityUsersForStaff } from '@/features/staff/services/identityUsersApi'

const STOCK_FORM_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

const EMPTY_EXCLUDE = new Set<string>()

function toYmd(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseYmd(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export type CompanyStockFormDialogProps = {
  open: boolean
  /** Data library product id */
  libraryProductId: string
  variantId: string
  onOpenChange: (open: boolean) => void
  onSaved: (item: LibraryProductVariantStock) => void
}

export function CompanyStockFormDialog({
  open,
  libraryProductId,
  variantId,
  onOpenChange,
  onSaved,
}: CompanyStockFormDialogProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [values, setValues] = useState<StockFormDraft>(createEmptyStockFormDraft)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(createEmptyStockFormDraft())
    setFieldErrors({})
    setError(null)
    setSaving(false)
    setSupplierPickerOpen(false)
  }, [open])

  const selectedSupplier: SelectUserValue | null = values.supplierUserId
    ? {
        id: values.supplierUserId,
        displayName: values.supplierDisplayName,
        email: values.supplierEmail,
      }
    : null

  const loadUsers: LoadUsersFn = useCallback(
    async (params) => {
      if (!accessToken) {
        return { users: [], hasMore: false }
      }
      return loadIdentityUsersForStaff(accessToken, params, EMPTY_EXCLUDE)
    },
    [accessToken],
  )

  function updateField<K extends keyof StockFormDraft>(key: K, value: StockFormDraft[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function applySupplier(user: UserOption) {
    setValues((prev) => ({
      ...prev,
      supplierUserId: user.id,
      supplierDisplayName: user.displayName,
      supplierEmail: user.email ?? '',
    }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.supplierUserId
      delete next.supplierDisplayName
      return next
    })
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    const parsed = stockFormSchema.safeParse(values)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const item = await dataLibraryApi.createProductVariantStock(
        libraryProductId,
        variantId,
        toCreateStockPayload(parsed.data),
      )
      onSaved(item)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Add stock"
        description="Record a stock batch for this product variant."
        sizeWidth={STOCK_FORM_DIALOG_SIZE.sizeWidth}
        sizeHeight={STOCK_FORM_DIALOG_SIZE.sizeHeight}
        nestedDismissGuard={supplierPickerOpen}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? 'Saving…' : 'Add stock'}
            </Button>
          </>
        }
      >
        <form
          id="company-stock-form"
          className="space-y-4"
          onSubmit={(e) => void handleSubmit(e)}
        >
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Quantity"
              htmlFor="company-stock-quantity"
              required
              error={fieldErrors.quantity}
            >
              <Input
                id="company-stock-quantity"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={values.quantity}
                onChange={(e) => updateField('quantity', e.target.value)}
              />
            </FormField>
            <FormField
              label="Batch number"
              htmlFor="company-stock-batch"
              required
              error={fieldErrors.batchNumber}
            >
              <Input
                id="company-stock-batch"
                value={values.batchNumber}
                onChange={(e) => updateField('batchNumber', e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Cost price"
              htmlFor="company-stock-cost"
              required
              error={fieldErrors.costPrice}
            >
              <Input
                id="company-stock-cost"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={values.costPrice}
                onChange={(e) => updateField('costPrice', e.target.value)}
              />
            </FormField>
            <FormField
              label="Sell price"
              htmlFor="company-stock-sell"
              required
              error={fieldErrors.sellPrice}
            >
              <Input
                id="company-stock-sell"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={values.sellPrice}
                onChange={(e) => updateField('sellPrice', e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Purchase date"
              htmlFor="company-stock-purchase"
              required
              error={fieldErrors.purchaseDate}
            >
              <DatePicker
                id="company-stock-purchase"
                value={parseYmd(values.purchaseDate)}
                onChange={(date) => updateField('purchaseDate', date ? toYmd(date) : '')}
                withIcon
                placeholder="Purchase date"
              />
            </FormField>
            <FormField
              label="Expired date"
              htmlFor="company-stock-expired"
              error={fieldErrors.expiredDate}
            >
              <DatePicker
                id="company-stock-expired"
                value={parseYmd(values.expiredDate)}
                onChange={(date) => updateField('expiredDate', date ? toYmd(date) : '')}
                withIcon
                placeholder="Expired date"
              />
            </FormField>
          </div>

          <FormField
            label="Supplier"
            htmlFor="company-stock-supplier"
            required
            error={fieldErrors.supplierUserId ?? fieldErrors.supplierDisplayName}
          >
            <SelectUser
              id="company-stock-supplier"
              selectedUser={selectedSupplier}
              placeholder="Select supplier"
              onClick={() => setSupplierPickerOpen(true)}
            />
          </FormField>
        </form>
      </CustomDialog>

      <UserSelectionDialog
        open={supplierPickerOpen}
        onOpenChange={setSupplierPickerOpen}
        onSelect={(user) => {
          applySupplier(user)
          setSupplierPickerOpen(false)
        }}
        loadUsers={loadUsers}
        title="Select supplier"
        description="Choose a user from Identity to set as the stock supplier."
      />
    </>
  )
}
