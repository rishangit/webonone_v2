import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  ListAddButton,
  useToast,
} from '@webonone/ui-kit'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import { dataLibraryApi } from '@/features/company-catalog/services/dataLibraryApi'
import type { HydratedCatalogItem } from '@/features/company-catalog/types/companyCatalog.types'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { PosCartList } from '@/features/sales/components/PosCartList'
import { PosItemPickerDialog } from '@/features/sales/components/PosItemPickerDialog'
import { upsertDraftSaleBodySchema } from '@/features/sales/schemas/salesSchemas'
import { salesApi } from '@/features/sales/services/salesApi'
import type {
  PosCartLine,
  SaleItemKind,
  TokenPosSubject,
} from '@/features/sales/types/sales.types'
import { buildDefaultServiceLine } from '@/features/sales/utils/buildDefaultServiceLine'
import { formatLkr, resolveProductUnitPrice } from '@/features/sales/utils/formatMoney'

type TokenPosDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: TokenPosSubject
  serviceId: string
  serviceName: string
  enabledKinds: SaleItemKind[]
  onBillSaved?: () => void
}

function saleLinesToCart(lines: {
  id: string
  itemKind: SaleItemKind
  catalogItemId: string
  name: string
  quantity: number
  unitPrice: number
}[]): PosCartLine[] {
  return lines.map((line) => ({
    key: line.id,
    itemKind: line.itemKind,
    catalogItemId: line.catalogItemId,
    name: line.name,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
  }))
}

export function TokenPosDialog({
  open,
  onOpenChange,
  token,
  serviceId,
  serviceName,
  enabledKinds,
  onBillSaved,
}: TokenPosDialogProps) {
  const { t } = useTranslation('sales')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()

  const [itemOpen, setItemOpen] = useState(false)
  const [lines, setLines] = useState<PosCartLine[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  usePlatformLoading(loading ? t('bill.loading') : saving ? t('tokenPos.savingBill') : null)

  const seedDefaultLines = useCallback(
    (listPrice: number | null | undefined) => {
      setLines([buildDefaultServiceLine(serviceId, serviceName, listPrice)])
    },
    [serviceId, serviceName],
  )

  useEffect(() => {
    if (!open || !serviceId) return
    let cancelled = false
    setFormError(null)
    setLoading(true)

    salesApi
      .getSessionTokenDraft(token.id)
      .then(async (draft) => {
        if (cancelled) return
        if (draft?.lines.length) {
          setLines(saleLinesToCart(draft.lines))
          return
        }
        const item = await companyCatalogApi.get('services', serviceId).catch(() => null)
        if (cancelled) return
        seedDefaultLines(item?.listPrice ?? 0)
      })
      .catch(() => {
        if (cancelled) return
        seedDefaultLines(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, serviceId, seedDefaultLines, token.id])

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

  async function handleSave() {
    const body = {
      customerUserId: token.userId,
      lines: lines.map((line) => ({
        itemKind: line.itemKind,
        catalogItemId: line.catalogItemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    }
    const parsed = upsertDraftSaleBodySchema.safeParse(body)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t('pos.validationFailed'))
      return
    }
    setFormError(null)
    setSaving(true)
    try {
      await salesApi.upsertSessionTokenDraft(token.id, parsed.data)
      toast({ title: t('tokenPos.saved') })
      onOpenChange(false)
      onBillSaved?.()
    } catch (err) {
      toast({
        title: t('tokenPos.saveFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
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
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        nestedDismissGuard={itemOpen}
        title={t('tokenPos.dialogTitle')}
        description={customerLabel}
        sizeWidth="large"
        sizeHeight="large"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
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
              disabled={saving || loading || lines.length === 0}
              onClick={() => void handleSave()}
            >
              {t('tokenPos.saveBill')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ListAddButton onClick={() => setItemOpen(true)} disabled={loading}>
              {t('pos.addItem')}
            </ListAddButton>
          </div>
          {!loading ? (
            <PosCartList
              lines={lines}
              onQuantityChange={(key, quantity) =>
                setLines((prev) =>
                  prev.map((line) =>
                    line.key === key
                      ? { ...line, quantity: Number.isFinite(quantity) ? quantity : 0 }
                      : line,
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
          ) : null}
          <p className="text-lg font-semibold">{t('pos.total', { amount: formatLkr(total) })}</p>
        </div>
      </CustomDialog>
      <PosItemPickerDialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        enabledKinds={enabledKinds}
        onPick={(item, kind) => {
          void handlePick(item, kind)
        }}
      />
    </>
  )
}
