import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
  FormField,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListItem,
  ListAddButton,
  itemListRowBodyClassName,
  itemListThumbClassName,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  UserSelectionDialog,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { identityCustomersApi, type IdentityCustomerOption } from '@/features/company-catalog/services/identityCustomersApi'
import { canAccessCompanySession } from '@/features/session/utils/canAccessCompanySession'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
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
import { salesActions } from '@/features/sales/store'
import type { PosCartLine, SalePaymentMethod } from '@/features/sales/types/sales.types'
import { formatLkr } from '@/features/sales/utils/formatMoney'
import { findPosCartStockViolation, posCartLinesToSaleLines } from '@/features/sales/utils/posCartSaleLines'
import { resolvePosEnabledKinds } from '@/features/sales/utils/posEnabledKinds'

export function PosPage() {
  const { t } = useTranslation('sales')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const assumableRoles = useAppSelector((s) => s.sessionRole.assumableRoles)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const detailStatus = useAppSelector((s) => s.sales.detailStatus)
  const detailError = useAppSelector((s) => s.sales.detailError)
  const detail = useAppSelector((s) => s.sales.detail)

  const [customer, setCustomer] = useState<IdentityCustomerOption | null>(null)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [lines, setLines] = useState<PosCartLine[]>([])
  const addCartLine = useCallback((line: PosCartLine) => {
    setLines((prev) => [...prev, line])
  }, [])
  const {
    handlePick,
    variantDialogOpen,
    pendingPick,
    confirmVariantSelection,
    closeVariantDialog,
  } = usePosProductPick({ onAddLine: addCartLine })
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const canManage = selectionComplete && canAccessCompanySession(activeRole, activeCompanyId)
  const saving = detailStatus === 'saving'
  usePlatformLoading(saving ? t('pos.completing') : null)

  const enabledKinds = useMemo(
    () =>
      resolvePosEnabledKinds(
        assumableRoles.find((role) => role.companyId === activeCompanyId)?.dataEntities,
      ),
    [assumableRoles, activeCompanyId],
  )

  const loadCustomers = useCallback(
    (params: Parameters<typeof identityCustomersApi.loadForSelection>[0]) =>
      identityCustomersApi.loadForSelection(params),
    [],
  )

  useEffect(() => {
    if (!submittingRef.current) return
    if (detailStatus === 'saving') return
    submittingRef.current = false
    if (detailError) {
      toast({
        title: t('pos.completeFailed'),
        description: detailError,
        variant: 'destructive',
      })
      return
    }
    if (detailStatus === 'idle' && detail?.id) {
      toast({ title: t('pos.completed') })
      navigate(`/sales/${detail.id}`)
    }
  }, [detailStatus, detailError, detail, navigate, t, toast])

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)

  function handleComplete() {
    if (paymentMethod === 'cash' && !validatePosCashReceived(cashReceived, total)) {
      setFormError(t('pos.cashReceivedInsufficient'))
      return
    }
    const stockViolation = findPosCartStockViolation(lines)
    if (stockViolation) {
      setFormError(
        t('pos.stockExceeded', {
          name: stockViolation.variantName ?? stockViolation.name,
          quantity: stockViolation.availableQuantity ?? 0,
        }),
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
      setFormError(parsed.error.issues[0]?.message ?? t('pos.validationFailed'))
      return
    }
    setFormError(null)
    submittingRef.current = true
    dispatch(salesActions.resetDetail())
    dispatch(salesActions.saveDetailRequested({ body: parsed.data }))
  }

  function handlePaymentMethodChange(value: SalePaymentMethod) {
    setPaymentMethod(value)
    if (value !== 'cash') {
      setCashReceived('')
    }
  }

  if (selectionComplete && !canManage) {
    return <Navigate to="/" replace />
  }

  return (
    <FeaturePage title={t('pos.title')} description={t('pos.description')}>
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card variant="list">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-lg">{t('pos.cartTitle')}</CardTitle>
              <ListAddButton onClick={() => setItemOpen(true)}>{t('pos.addItem')}</ListAddButton>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card variant="list">
            <CardHeader>
              <CardTitle className="text-lg">{t('pos.customerTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {customer ? (
                <ItemList className="py-0">
                  <ItemListItem>
                    <ItemListContent>
                      <div className={itemListRowBodyClassName}>
                        <ImagePreview
                          src={customer.avatarUrl ?? null}
                          alt={customer.displayName}
                          mode="view"
                          className={itemListThumbClassName}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{customer.displayName}</p>
                          {customer.email ? (
                            <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
                          ) : null}
                        </div>
                      </div>
                    </ItemListContent>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 self-start text-muted-foreground"
                      onClick={() => setCustomer(null)}
                      aria-label={t('pos.removeCustomerAria', { name: customer.displayName })}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </Button>
                  </ItemListItem>
                </ItemList>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setCustomerOpen(true)}>
                  {t('pos.selectCustomer')}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('pos.paymentTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label={t('pos.paymentMethod')} htmlFor="pos-payment" required>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => handlePaymentMethodChange(value as SalePaymentMethod)}
                >
                  <SelectTrigger id="pos-payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t('payment.cash')}</SelectItem>
                    <SelectItem value="card">{t('payment.card')}</SelectItem>
                    <SelectItem value="other">{t('payment.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              {paymentMethod === 'cash' ? (
                <PosCashPaymentFields
                  total={total}
                  cashReceived={cashReceived}
                  onCashReceivedChange={setCashReceived}
                  inputId="pos-cash-received"
                />
              ) : null}
              <p className="text-lg font-semibold">{t('pos.total', { amount: formatLkr(total) })}</p>
              <Button type="button" className="w-full" disabled={saving} onClick={handleComplete}>
                {t('pos.complete')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <UserSelectionDialog
        open={customerOpen}
        onOpenChange={setCustomerOpen}
        title={t('pos.selectCustomerTitle')}
        description={t('pos.selectCustomerDescription')}
        emptyMessage={t('pos.noCustomers')}
        loadUsers={loadCustomers}
        chrome="dialog"
        onSelect={(selected) => {
          setCustomer({
            id: selected.id,
            displayName: selected.displayName,
            email: selected.email,
            avatarUrl: selected.avatarUrl ?? null,
          })
        }}
        onAddUser={() => setNewCustomerOpen(true)}
        nestedDismissGuard={newCustomerOpen}
      />
      <PosNewCustomerDialog
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
        onCreated={(created) => {
          setCustomer(created)
          setCustomerOpen(false)
        }}
      />
      <PosItemPickerDialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        enabledKinds={enabledKinds}
        onPick={(item, kind) => {
          void handlePick(item, kind)
        }}
      />
      {pendingPick ? (
        <PosProductVariantDialog
          open={variantDialogOpen}
          onOpenChange={closeVariantDialog}
          productName={pendingPick.item.displayName}
          options={pendingPick.options}
          onConfirm={confirmVariantSelection}
        />
      ) : null}
    </FeaturePage>
  )
}
