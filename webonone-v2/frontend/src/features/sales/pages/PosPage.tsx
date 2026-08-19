import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  ListAddButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  UserSelectionDialog,
  useToast,
} from '@webonone/ui-kit'
import { filterCompanyDataEntities } from '@webonone/platform-nav'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { identityCustomersApi, type IdentityCustomerOption } from '@/features/company-catalog/services/identityCustomersApi'
import { dataLibraryApi } from '@/features/company-catalog/services/dataLibraryApi'
import type { HydratedCatalogItem } from '@/features/company-catalog/types/companyCatalog.types'
import { canManageCompanyEvents } from '@/features/session/utils/canAccessCompanySession'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { PosCartList } from '@/features/sales/components/PosCartList'
import { PosItemPickerDialog } from '@/features/sales/components/PosItemPickerDialog'
import { PosNewCustomerDialog } from '@/features/sales/components/PosNewCustomerDialog'
import { createSaleBodySchema } from '@/features/sales/schemas/salesSchemas'
import { salesActions } from '@/features/sales/store'
import type { PosCartLine, SaleItemKind, SalePaymentMethod } from '@/features/sales/types/sales.types'
import { formatLkr, resolveProductUnitPrice } from '@/features/sales/utils/formatMoney'

const CATALOG_TO_SALE: Record<'products' | 'services' | 'spaces', SaleItemKind> = {
  products: 'product',
  services: 'service',
  spaces: 'space',
}

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
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('cash')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const canManage = selectionComplete && canManageCompanyEvents(activeRole, activeCompanyId)
  const saving = detailStatus === 'saving'
  usePlatformLoading(saving ? t('pos.completing') : null)

  const enabledKinds = useMemo(() => {
    const entities = assumableRoles.find((role) => role.companyId === activeCompanyId)?.dataEntities
    const enabled = filterCompanyDataEntities(entities ?? [])
    const kinds = enabled
      .map((key) => CATALOG_TO_SALE[key as keyof typeof CATALOG_TO_SALE])
      .filter((kind): kind is SaleItemKind => Boolean(kind))
    return kinds.length > 0 ? kinds : (['product', 'service', 'space'] as SaleItemKind[])
  }, [assumableRoles, activeCompanyId])

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

  async function handlePick(item: HydratedCatalogItem, itemKind: SaleItemKind) {
    let unitPrice = item.listPrice ?? 0
    if (itemKind === 'product') {
      const resolved = await resolveProductUnitPrice({
        listPrice: item.listPrice,
        libraryEntityId: item.libraryEntityId,
        loadVariants: (productId) => dataLibraryApi.listProductVariants(productId),
        loadStocks: (productId, variantId) =>
          dataLibraryApi.listProductVariantStocks(productId, variantId),
      })
      if (resolved != null) unitPrice = resolved
    }
    setLines((prev) => [
      ...prev,
      {
        key: `${item.id}-${Date.now()}`,
        itemKind,
        catalogItemId: item.id,
        name: item.displayName,
        quantity: 1,
        unitPrice,
      },
    ])
  }

  function handleComplete() {
    const body = {
      customerUserId: customer?.id ?? '',
      paymentMethod,
      notes: notes.trim() || null,
      lines: lines.map((line) => ({
        itemKind: line.itemKind,
        catalogItemId: line.catalogItemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
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

  if (selectionComplete && !canManage) {
    return <Navigate to="/" replace />
  }

  return (
    <FeaturePage
      title={t('pos.title')}
      description={t('pos.description')}
      actions={
        <ListAddButton onClick={() => setItemOpen(true)}>{t('pos.addItem')}</ListAddButton>
      }
    >
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('pos.cartTitle')}</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('pos.customerTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                {customer
                  ? `${customer.displayName}${customer.email ? ` (${customer.email})` : ''}`
                  : t('pos.noCustomer')}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => setCustomerOpen(true)}>
                {t('pos.selectCustomer')}
              </Button>
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
                  onValueChange={(value) => setPaymentMethod(value as SalePaymentMethod)}
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
              <FormField label={t('pos.notes')} htmlFor="pos-notes">
                <Textarea
                  id="pos-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormField>
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
    </FeaturePage>
  )
}
