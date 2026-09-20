import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Redirect, useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Avatar,
  Body,
  Button,
  Card,
  FeatureScreen,
  ListAddButton,
  NativeSelect,
  Subheading,
  getAvatarInitials,
  useToast,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { CustomerPickerDialog } from '@/features/sales/components/CustomerPickerDialog'
import {
  PosCashPaymentFields,
  validatePosCashReceived,
} from '@/features/sales/components/PosCashPaymentFields'
import { PosCartList } from '@/features/sales/components/PosCartList'
import { PosItemPickerDialog } from '@/features/sales/components/PosItemPickerDialog'
import { PosNewCustomerDialog } from '@/features/sales/components/PosNewCustomerDialog'
import { PosProductVariantDialog } from '@/features/sales/components/PosProductVariantDialog'
import { usePosProductPick } from '@/features/sales/hooks/usePosProductPick'
import { createSaleBodySchema } from '@/features/sales/schemas/salesSchemas'
import { salesApi } from '@/features/sales/services/salesApi'
import type { CustomerOption } from '@/features/sales/services/customersApi'
import type { PosCartLine, SalePaymentMethod } from '@/features/sales/types/sales.types'
import { canAccessCompanySession } from '@/features/sales/utils/canAccessCompanySession'
import { formatLkr } from '@/features/sales/utils/formatMoney'
import { findPosCartStockViolation, posCartLinesToSaleLines } from '@/features/sales/utils/posCartSaleLines'
import { resolvePosEnabledKinds } from '@/features/sales/utils/posEnabledKinds'
import { saleDetailPath } from '@/features/sales/utils/salePaths'

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
]

export function PosScreen() {
  const { t } = useTranslation('sales')
  const router = useRouter()
  const { user, roleOptions } = useSession()
  const { toast } = useToast()

  const selectedRole = roleOptions.find(
    (option) => option.role === user?.role && (option.companyId ?? null) === (user?.companyId ?? null),
  )
  const canManage = canAccessCompanySession(user?.role, user?.companyId)
  const enabledKinds = useMemo(
    () => resolvePosEnabledKinds(selectedRole?.dataEntities),
    [selectedRole?.dataEntities],
  )

  const [customer, setCustomer] = useState<CustomerOption | null>(null)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [lines, setLines] = useState<PosCartLine[]>([])
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const addCartLine = useCallback((line: PosCartLine) => {
    setLines((prev) => [...prev, line])
  }, [])

  const {
    handlePick,
    picking,
    variantDialogOpen,
    pendingPick,
    confirmVariantSelection,
    closeVariantDialog,
  } = usePosProductPick({ onAddLine: addCartLine })

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)

  if (user && !canManage) {
    return <Redirect href="/" />
  }

  async function handleComplete() {
    if (paymentMethod === 'cash' && !validatePosCashReceived(cashReceived, total)) {
      setFormError('Received amount must be at least the total')
      return
    }
    const stockViolation = findPosCartStockViolation(lines)
    if (stockViolation) {
      setFormError(
        `Quantity for ${stockViolation.variantName ?? stockViolation.name} exceeds available stock (${stockViolation.availableQuantity ?? 0}).`,
      )
      return
    }
    const body = {
      customerUserId: customer?.id ?? '',
      paymentMethod,
      notes: null,
      lines: posCartLinesToSaleLines(lines),
    }
    const parsed = createSaleBodySchema.safeParse(body)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the sale details and try again')
      return
    }

    setFormError(null)
    setSaving(true)
    try {
      const sale = await salesApi.create(parsed.data)
      toast({ title: 'Sale completed' })
      router.push(saleDetailPath(sale.id) as Href)
    } catch (err) {
      toast({
        title: 'Failed to complete sale',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <FeatureScreen
      title={t('pos.title')}
      description={t('pos.description')}
    >
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-3">
        <View className="flex-row items-start justify-between gap-2">
          <Subheading>Items</Subheading>
          <ListAddButton onPress={() => setItemOpen(true)}>Add item</ListAddButton>
        </View>
        <PosCartList
          lines={lines}
          onQuantityChange={(key, quantity) =>
            setLines((prev) =>
              prev.map((line) =>
                line.key === key ? { ...line, quantity: Number.isFinite(quantity) ? quantity : 0 } : line,
              ),
            )
          }
          onUnitPriceChange={(key, unitPrice) =>
            setLines((prev) =>
              prev.map((line) =>
                line.key === key
                  ? { ...line, unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0 }
                  : line,
              ),
            )
          }
          onRemove={(key) => setLines((prev) => prev.filter((line) => line.key !== key))}
        />
      </Card>

      <Card className="gap-3">
        <Subheading>Customer</Subheading>
        {customer ? (
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
              <Avatar
                src={customer.avatarUrl ?? undefined}
                fallback={getAvatarInitials(customer.displayName)}
                size="sm"
              />
              <View className="min-w-0 flex-1">
                <Body className="text-sm font-medium">{customer.displayName}</Body>
                {customer.email ? <Body className="text-xs text-muted-foreground">{customer.email}</Body> : null}
              </View>
            </View>
            <Button variant="ghost" size="sm" onPress={() => setCustomer(null)}>Remove</Button>
          </View>
        ) : (
          <Button variant="outline" size="sm" onPress={() => setCustomerOpen(true)}>Select customer</Button>
        )}
      </Card>

      <Card className="gap-4">
        <Subheading>Payment</Subheading>
        <NativeSelect
          label="Payment method"
          required
          value={paymentMethod}
          onValueChange={(value) => {
            setPaymentMethod(value as SalePaymentMethod)
            if (value !== 'cash') setCashReceived('')
          }}
          options={PAYMENT_OPTIONS}
          allowEmpty={false}
        />
        {paymentMethod === 'cash' ? (
          <PosCashPaymentFields
            total={total}
            cashReceived={cashReceived}
            onCashReceivedChange={setCashReceived}
          />
        ) : null}
        <Body className="text-lg font-semibold">Total {formatLkr(total)}</Body>
        <Button className="w-full" disabled={saving} onPress={() => void handleComplete()}>
          {saving ? 'Completing sale…' : 'Complete sale'}
        </Button>
      </Card>

      <CustomerPickerDialog
        open={customerOpen}
        onOpenChange={setCustomerOpen}
        selectedId={customer?.id}
        onSelect={setCustomer}
        onAddNew={() => {
          setCustomerOpen(false)
          setNewCustomerOpen(true)
        }}
      />
      <PosNewCustomerDialog
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
        onCreated={(created) => {
          setCustomer(created)
          setNewCustomerOpen(false)
        }}
      />
      <PosItemPickerDialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        enabledKinds={enabledKinds}
        picking={picking}
        onPick={async (item, kind) => {
          const result = await handlePick(item, kind)
          if (result === 'added') setItemOpen(false)
        }}
      />
      {pendingPick ? (
        <PosProductVariantDialog
          open={variantDialogOpen}
          onOpenChange={closeVariantDialog}
          productName={pendingPick.item.displayName}
          options={pendingPick.options}
          onConfirm={(selection) => {
            confirmVariantSelection(selection)
            setItemOpen(false)
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
