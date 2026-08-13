import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  isPlatformPeerDialogNestedCancelMessage,
  isPlatformPeerDialogNestedResultMessage,
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogNestedRequest,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
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
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  createNestedRequestId,
  USER_SELECT_DIALOG,
  USER_SELECT_EMBED_PATH,
} from '@/features/identity/utils/userSelectDialog'
import { loadIdentityUsers } from '@/features/identity/services/identityUsersApi'
import {
  createEmptyStockFormDraft,
  stockFormSchema,
  toCreateStockPayload,
  type StockFormDraft,
} from '@/features/products/schemas/stockSchemas'
import { dataApi } from '@/shared/services/dataApi'
import type { ProductVariantStock } from '@/shared/types/data.types'

const STOCK_FORM_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

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

function isUserOption(value: unknown): value is UserOption {
  if (!value || typeof value !== 'object') return false
  const user = value as Record<string, unknown>
  return typeof user.id === 'string' && typeof user.displayName === 'string'
}

export interface StockFormDialogProps {
  open: boolean
  productId: string
  variantId: string
  onOpenChange: (open: boolean) => void
  onSaved: (item: ProductVariantStock) => void
  chrome?: 'dialog' | 'embed-page'
}

export function StockFormDialog({
  open,
  productId,
  variantId,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: StockFormDialogProps) {
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const path = `/embed/dialogs/products/${productId}/variants/${variantId}/stocks/create`
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null
  const title = t('stock.addTitle')
  const description = t('stock.addDescription')
  const submitLabel = t('stock.addTitle')

  const [values, setValues] = useState<StockFormDraft>(createEmptyStockFormDraft)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false)
  const nestedSupplierRequestIdRef = useRef<string | null>(null)

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path,
    title,
    description,
    submitLabel,
    ...STOCK_FORM_DIALOG_SIZE,
    onResult: (payload) => {
      if (payload && typeof payload === 'object' && typeof (payload as ProductVariantStock).id === 'string') {
        onSaved(payload as ProductVariantStock)
      } else {
        onSaved({} as ProductVariantStock)
      }
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  const selectedSupplier: SelectUserValue | null = values.supplierUserId
    ? {
        id: values.supplierUserId,
        displayName: values.supplierDisplayName,
        email: values.supplierEmail,
      }
    : null

  const applySupplier = useCallback((user: UserOption) => {
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
  }, [])

  const closeSupplierPicker = useCallback(() => {
    setSupplierPickerOpen(false)
    nestedSupplierRequestIdRef.current = null
  }, [])

  const openSupplierPicker = useCallback(() => {
    if (chrome === 'embed-page' && parentOrigin && dialogRequestId) {
      const nestedRequestId = createNestedRequestId()
      nestedSupplierRequestIdRef.current = nestedRequestId
      setSupplierPickerOpen(true)
      sendPlatformPeerDialogNestedRequest(parentOrigin, {
        parentRequestId: dialogRequestId,
        requestId: nestedRequestId,
        path: USER_SELECT_EMBED_PATH,
        title: 'Select supplier',
        description: 'Choose a user from Identity to set as the stock supplier.',
        submitLabel: 'Done',
        ...USER_SELECT_DIALOG,
      })
      return
    }
    setSupplierPickerOpen(true)
  }, [chrome, dialogRequestId, parentOrigin])

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      const nestedId = nestedSupplierRequestIdRef.current
      if (!nestedId) return

      if (
        isPlatformPeerDialogNestedResultMessage(event.data) &&
        event.data.parentRequestId === dialogRequestId &&
        event.data.requestId === nestedId
      ) {
        if (isUserOption(event.data.payload)) {
          applySupplier(event.data.payload)
        }
        closeSupplierPicker()
        return
      }

      if (
        isPlatformPeerDialogNestedCancelMessage(event.data) &&
        event.data.parentRequestId === dialogRequestId &&
        event.data.requestId === nestedId
      ) {
        closeSupplierPicker()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [applySupplier, chrome, closeSupplierPicker, dialogRequestId, parentOrigin])

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setValues(createEmptyStockFormDraft())
    setFieldErrors({})
    setError(null)
    setSaving(false)
    setSupplierPickerOpen(false)
    nestedSupplierRequestIdRef.current = null
  }, [chrome, open])

  const loadUsers: LoadUsersFn = useCallback(
    async (params) => {
      if (!accessToken) {
        return { users: [], hasMore: false }
      }
      return loadIdentityUsers(accessToken, params)
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

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    if (nestedSupplierRequestIdRef.current) return

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
      const item = await dataApi.createProductVariantStock(
        productId,
        variantId,
        toCreateStockPayload(parsed.data),
      )
      onSaved(item)
      if (chrome === 'dialog') {
        onOpenChange(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stock')
    } finally {
      setSaving(false)
    }
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      void handleSubmit()
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      saving || Boolean(nestedSupplierRequestIdRef.current),
      saving ? t('saving') : submitLabel,
    )
  }, [chrome, dialogRequestId, parentOrigin, saving, supplierPickerOpen])

  const body = (
    <form id="stock-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('stock.quantity')} htmlFor="stock-quantity" required error={fieldErrors.quantity}>
          <Input
            id="stock-quantity"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={values.quantity}
            onChange={(e) => updateField('quantity', e.target.value)}
          />
        </FormField>
        <FormField
          label={t('stock.batchNumber')}
          htmlFor="stock-batch-number"
          required
          error={fieldErrors.batchNumber}
        >
          <Input
            id="stock-batch-number"
            value={values.batchNumber}
            onChange={(e) => updateField('batchNumber', e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('stock.costPrice')} htmlFor="stock-cost-price" required error={fieldErrors.costPrice}>
          <Input
            id="stock-cost-price"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={values.costPrice}
            onChange={(e) => updateField('costPrice', e.target.value)}
          />
        </FormField>
        <FormField label={t('stock.sellPrice')} htmlFor="stock-sell-price" required error={fieldErrors.sellPrice}>
          <Input
            id="stock-sell-price"
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
          label={t('stock.purchaseDate')}
          htmlFor="stock-purchase-date"
          required
          error={fieldErrors.purchaseDate}
        >
          <DatePicker
            id="stock-purchase-date"
            value={parseYmd(values.purchaseDate)}
            onChange={(date) => updateField('purchaseDate', date ? toYmd(date) : '')}
            withIcon
            placeholder={t('stock.purchaseDate')}
          />
        </FormField>
        <FormField
          label={t('stock.expiredDate')}
          htmlFor="stock-expired-date"
          error={fieldErrors.expiredDate}
        >
          <DatePicker
            id="stock-expired-date"
            value={parseYmd(values.expiredDate)}
            onChange={(date) => updateField('expiredDate', date ? toYmd(date) : '')}
            withIcon
            placeholder={t('stock.expiredDate')}
          />
        </FormField>
      </div>

      <FormField
        label={t('stock.supplier')}
        htmlFor="stock-supplier"
        required
        error={fieldErrors.supplierUserId ?? fieldErrors.supplierDisplayName}
      >
        <SelectUser
          id="stock-supplier"
          selectedUser={selectedSupplier}
          placeholder={t('stock.selectSupplier')}
          onClick={openSupplierPicker}
        />
      </FormField>
    </form>
  )

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={saving}
      >
        {tc('cancel')}
      </Button>
      <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
        {saving ? t('saving') : submitLabel}
      </Button>
    </>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }

  if (isHosted) {
    return null
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        sizeWidth={STOCK_FORM_DIALOG_SIZE.sizeWidth}
        sizeHeight={STOCK_FORM_DIALOG_SIZE.sizeHeight}
        footer={actions}
        nestedDismissGuard={supplierPickerOpen}
      >
        {body}
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
