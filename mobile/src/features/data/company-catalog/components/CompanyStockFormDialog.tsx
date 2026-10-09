import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Button,
  CustomDialog,
  FormField,
  SelectUser,
  TextField,
  UserSelectionDialog,
  type UserOption,
  useToast,
} from '@webonone/mobile-ui'
import { mapZodIssuesToFieldErrors } from '@/features/data/schemas/dataSchemas'
import {
  createEmptyStockFormDraft,
  createStockDraftFromItem,
  stockFormSchema,
  toCreateStockPayload,
  type StockFormDraft,
} from '@/features/data/company-catalog/schemas/stockSchemas'
import {
  dataLibraryApi,
  type LibraryProductVariantStock,
} from '@/features/sales/services/dataLibraryApi'
import { loadIdentityUsersForStaff } from '@/features/staff/services/identityUsersApi'

export function CompanyStockFormDialog({
  open,
  libraryProductId,
  variantId,
  stock = null,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  libraryProductId: string
  variantId: string
  stock?: LibraryProductVariantStock | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const isNew = !stock
  const [values, setValues] = useState<StockFormDraft>(createEmptyStockFormDraft)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof StockFormDraft, string>>>({})
  const [saving, setSaving] = useState(false)
  const [generatingBatch, setGeneratingBatch] = useState(false)
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false)
  const [pickerUsers, setPickerUsers] = useState<UserOption[]>([])

  useEffect(() => {
    if (!open) return
    setValues(stock ? createStockDraftFromItem(stock) : createEmptyStockFormDraft())
    setFieldErrors({})
    setSaving(false)
    setGeneratingBatch(false)
    setSupplierPickerOpen(false)
  }, [open, stock])

  const loadPickerUsers = useCallback(async () => {
    try {
      const result = await loadIdentityUsersForStaff({ pageSize: 100 })
      setPickerUsers(result.users)
    } catch {
      setPickerUsers([])
    }
  }, [])

  useEffect(() => {
    if (supplierPickerOpen) void loadPickerUsers()
  }, [supplierPickerOpen, loadPickerUsers])

  const selectedSupplier = values.supplierUserId
    ? {
        id: values.supplierUserId,
        displayName: values.supplierDisplayName,
        email: values.supplierEmail || '',
      }
    : null

  function updateField<K extends keyof StockFormDraft>(key: K, value: StockFormDraft[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function handleGenerateBatchNumber() {
    setGeneratingBatch(true)
    try {
      const { batchNumber } = await dataLibraryApi.suggestStockBatchNumber()
      updateField('batchNumber', batchNumber)
    } catch (err) {
      toast({
        title: 'Failed to generate batch number',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setGeneratingBatch(false)
    }
  }

  async function handleSubmit() {
    const parsed = stockFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setSaving(true)
    try {
      const payload = toCreateStockPayload(parsed.data)
      if (isNew) {
        await dataLibraryApi.createProductVariantStock(libraryProductId, variantId, payload)
      } else {
        await dataLibraryApi.updateProductVariantStock(
          libraryProductId,
          variantId,
          stock.id,
          payload,
        )
      }
      toast({ title: isNew ? 'Stock added' : 'Stock updated' })
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast({
        title: isNew ? 'Failed to create stock' : 'Failed to update stock',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isNew ? 'Add stock' : 'Edit stock'}
        description={
          isNew
            ? 'Record a stock batch for this product variant.'
            : 'Update this stock batch.'
        }
        sizeWidth="medium"
        sizeHeight="large"
        nestedDismissGuard={supplierPickerOpen}
        footer={
          <>
            <Button variant="outline" disabled={saving} onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onPress={() => void handleSubmit()}>
              {saving ? 'Saving…' : isNew ? 'Add stock' : 'Save'}
            </Button>
          </>
        }
      >
        <View className="gap-4">
          <FormField label="Quantity" required error={fieldErrors.quantity}>
            <TextField
              value={values.quantity}
              onChangeText={(text) => updateField('quantity', text)}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </FormField>

          <FormField label="Batch number" required error={fieldErrors.batchNumber}>
            <View className="flex-row flex-wrap items-center gap-2">
              <View className="min-w-0 flex-1">
                <TextField
                  value={values.batchNumber}
                  onChangeText={(text) => updateField('batchNumber', text)}
                  editable={!generatingBatch && !saving}
                />
              </View>
              <Button
                variant="outline"
                size="sm"
                disabled={saving || generatingBatch}
                onPress={() => void handleGenerateBatchNumber()}
              >
                {generatingBatch ? '…' : 'Generate'}
              </Button>
            </View>
          </FormField>

          <FormField label="Cost price" required error={fieldErrors.costPrice}>
            <TextField
              value={values.costPrice}
              onChangeText={(text) => updateField('costPrice', text)}
              keyboardType="decimal-pad"
            />
          </FormField>

          <FormField label="Sell price" required error={fieldErrors.sellPrice}>
            <TextField
              value={values.sellPrice}
              onChangeText={(text) => updateField('sellPrice', text)}
              keyboardType="decimal-pad"
            />
          </FormField>

          <FormField label="Purchase date (YYYY-MM-DD)" required error={fieldErrors.purchaseDate}>
            <TextField
              value={values.purchaseDate}
              onChangeText={(text) => updateField('purchaseDate', text)}
              placeholder="2026-09-23"
              autoCapitalize="none"
            />
          </FormField>

          <FormField label="Expired date (YYYY-MM-DD)" error={fieldErrors.expiredDate}>
            <TextField
              value={values.expiredDate}
              onChangeText={(text) => updateField('expiredDate', text)}
              placeholder="Optional"
              autoCapitalize="none"
            />
          </FormField>

          <FormField
            label="Supplier"
            error={fieldErrors.supplierUserId ?? fieldErrors.supplierDisplayName}
          >
            <SelectUser
              selectedUser={selectedSupplier}
              placeholder="Select supplier"
              onPress={() => setSupplierPickerOpen(true)}
            />
          </FormField>
        </View>
      </CustomDialog>

      <UserSelectionDialog
        open={supplierPickerOpen}
        onOpenChange={setSupplierPickerOpen}
        users={pickerUsers}
        title="Select supplier"
        onSelect={(user) => {
          updateField('supplierUserId', user.id)
          updateField('supplierDisplayName', user.displayName)
          updateField('supplierEmail', user.email ?? '')
          setSupplierPickerOpen(false)
        }}
      />
    </>
  )
}
