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
import { catalogItemImageUrl } from '@/features/company-catalog/utils/firstGalleryImageUrl'
import { hydrateLinkedCatalogItems } from '@/features/company-catalog/utils/hydrateLinkedCatalog'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { PosCartList } from '@/features/sales/components/PosCartList'
import { PosItemPickerDialog } from '@/features/sales/components/PosItemPickerDialog'
import { PosProductVariantDialog } from '@/features/sales/components/PosProductVariantDialog'
import { usePosProductPick } from '@/features/sales/hooks/usePosProductPick'
import { upsertDraftSaleBodySchema } from '@/features/sales/schemas/salesSchemas'
import { salesApi } from '@/features/sales/services/salesApi'
import type {
  PosCartLine,
  SaleItemKind,
  SaleLine,
  TokenPosSubject,
} from '@/features/sales/types/sales.types'
import { buildDefaultServiceLine } from '@/features/sales/utils/buildDefaultServiceLine'
import { hydratePosCartLineImages } from '@/features/sales/utils/hydratePosCartLineImages'
import { formatLkr } from '@/features/sales/utils/formatMoney'
import { findPosCartStockViolation, posCartLinesToSaleLines } from '@/features/sales/utils/posCartSaleLines'

type TokenPosDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: TokenPosSubject
  serviceId: string
  serviceName: string
  enabledKinds: SaleItemKind[]
  onBillSaved?: () => void
}

function saleLinesToCart(lines: SaleLine[]): PosCartLine[] {
  return lines.map((line) => ({
    key: line.id,
    itemKind: line.itemKind,
    catalogItemId: line.catalogItemId,
    name: line.name,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    libraryProductId: line.libraryEntityId,
    libraryVariantId: line.libraryVariantId ?? null,
    libraryStockId: line.libraryStockId ?? null,
    variantName: line.variantName,
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
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  usePlatformLoading(loading ? t('bill.loading') : saving ? t('tokenPos.savingBill') : null)

  const seedDefaultLines = useCallback(
    (listPrice: number | null | undefined, imageUrl?: string | null) => {
      setLines([buildDefaultServiceLine(serviceId, serviceName, listPrice, imageUrl)])
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
          const cart = saleLinesToCart(draft.lines)
          const withImages = await hydratePosCartLineImages(cart)
          if (!cancelled) setLines(withImages)
          return
        }
        const item = await companyCatalogApi.get('services', serviceId).catch(() => null)
        if (cancelled) return
        if (item) {
          const [hydrated] = await hydrateLinkedCatalogItems('services', [item])
          seedDefaultLines(hydrated.listPrice, catalogItemImageUrl(hydrated))
          return
        }
        seedDefaultLines(0, null)
      })
      .catch(() => {
        if (cancelled) return
        seedDefaultLines(0, null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, serviceId, seedDefaultLines, token.id])

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)

  async function handleSave() {
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
      customerUserId: token.userId,
      lines: posCartLinesToSaleLines(lines),
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
        nestedDismissGuard={itemOpen || variantDialogOpen}
        title={t('tokenPos.dialogTitle')}
        description={customerLabel}
        sizeWidth="large"
        sizeHeight="large"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-4">
            <p className="text-lg font-semibold">{t('pos.total', { amount: formatLkr(total) })}</p>
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
        </div>
      </CustomDialog>
      <PosItemPickerDialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        enabledKinds={enabledKinds}
        stackLevel={1}
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
    </>
  )
}
