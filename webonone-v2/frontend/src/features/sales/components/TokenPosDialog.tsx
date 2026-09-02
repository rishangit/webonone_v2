import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { PosLibraryRequestsCard } from '@/features/sales/components/PosLibraryRequestList'
import { PosProductVariantDialog } from '@/features/sales/components/PosProductVariantDialog'
import { usePosProductPick } from '@/features/sales/hooks/usePosProductPick'
import { useNestedDialogDismissBuffer } from '@/features/sales/hooks/useNestedDialogDismissBuffer'
import { upsertDraftSaleBodySchema } from '@/features/sales/schemas/salesSchemas'
import { salesApi } from '@/features/sales/services/salesApi'
import type {
  PosCartLine,
  PosLibraryRequest,
  SaleItemKind,
  SaleLine,
  TokenPosSubject,
} from '@/features/sales/types/sales.types'
import { buildDefaultServiceLine } from '@/features/sales/utils/buildDefaultServiceLine'
import { hydratePosCartLineImages } from '@/features/sales/utils/hydratePosCartLineImages'
import {
  mergeLibraryRequestsIntoNotes,
  parseLibraryRequestsNote,
} from '@/features/sales/utils/libraryRequestNotes'
import { formatLkr } from '@/features/sales/utils/formatMoney'
import { findPosCartStockViolation, posCartLinesToSaleLines } from '@/features/sales/utils/posCartSaleLines'

type TokenPosDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: TokenPosSubject
  serviceId: string
  serviceName: string
  enabledKinds: SaleItemKind[]
  libraryItemsEnabled?: boolean
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
  libraryItemsEnabled = false,
  onBillSaved,
}: TokenPosDialogProps) {
  const { t } = useTranslation('sales')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()

  const [itemOpen, setItemOpen] = useState(false)
  const itemOpenRef = useRef(false)
  const variantOpenRef = useRef(false)
  const { blockDismiss, armDismissBuffer, isDismissBlocked } = useNestedDialogDismissBuffer()
  const [lines, setLines] = useState<PosCartLine[]>([])
  const [libraryRequests, setLibraryRequests] = useState<PosLibraryRequest[]>([])
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

  useEffect(() => {
    itemOpenRef.current = itemOpen
  }, [itemOpen])

  useEffect(() => {
    variantOpenRef.current = variantDialogOpen
  }, [variantDialogOpen])

  const closeVariantDialogSafely = useCallback(
    (nextOpen: boolean) => {
      closeVariantDialog(nextOpen)
      if (!nextOpen) {
        armDismissBuffer()
      }
    },
    [armDismissBuffer, closeVariantDialog],
  )

  function handleBillOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true)
      return
    }
    if (variantDialogOpen || variantOpenRef.current) {
      closeVariantDialogSafely(false)
      return
    }
    if (itemOpen || itemOpenRef.current) {
      setItemOpen(false)
      return
    }
    if (isDismissBlocked()) return
    onOpenChange(false)
  }

  function handleItemOpenChange(next: boolean) {
    if (next) {
      setItemOpen(true)
      return
    }
    if (variantDialogOpen || variantOpenRef.current) {
      closeVariantDialogSafely(false)
      return
    }
    if (isDismissBlocked()) return
    setItemOpen(false)
  }

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
    setLibraryRequests([])

    salesApi
      .getSessionTokenDraft(token.id)
      .then(async (draft) => {
        if (cancelled) return
        if (draft?.lines.length) {
          const cart = saleLinesToCart(draft.lines)
          const withImages = await hydratePosCartLineImages(cart)
          if (!cancelled) setLines(withImages)
        } else {
          const item = await companyCatalogApi.get('services', serviceId).catch(() => null)
          if (cancelled) return
          if (item) {
            const [hydrated] = await hydrateLinkedCatalogItems('services', [item])
            seedDefaultLines(hydrated.listPrice, catalogItemImageUrl(hydrated))
          } else {
            seedDefaultLines(0, null)
          }
        }
        if (draft?.notes) {
          const parsed = parseLibraryRequestsNote(draft.notes)
          if (!cancelled) setLibraryRequests(parsed.requests)
        }
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

  function handlePickLibrary(request: PosLibraryRequest) {
    setLibraryRequests((prev) => [...prev, request])
  }

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
      notes: mergeLibraryRequestsIntoNotes(libraryRequests),
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
        onOpenChange={handleBillOpenChange}
        nestedDismissGuard={itemOpen || variantDialogOpen || blockDismiss}
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
              onClick={() => handleBillOpenChange(false)}
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
          {!loading ? (
            <>
              <Card variant="list">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <CardTitle className="text-lg">{t('pos.cartTitle')}</CardTitle>
                  <ListAddButton onClick={() => setItemOpen(true)} disabled={loading}>
                    {t('pos.addItem')}
                  </ListAddButton>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
              {libraryItemsEnabled ? (
                <PosLibraryRequestsCard
                  requests={libraryRequests}
                  onQuantityChange={(key, quantity) =>
                    setLibraryRequests((prev) =>
                      prev.map((request) =>
                        request.key === key
                          ? { ...request, quantity: Number.isFinite(quantity) ? quantity : 0 }
                          : request,
                      ),
                    )
                  }
                  onRemove={(key) =>
                    setLibraryRequests((prev) => prev.filter((request) => request.key !== key))
                  }
                />
              ) : null}
            </>
          ) : null}
        </div>
      </CustomDialog>
      <PosItemPickerDialog
        open={itemOpen}
        onOpenChange={handleItemOpenChange}
        enabledKinds={enabledKinds}
        libraryModeEnabled={libraryItemsEnabled}
        onPickLibrary={handlePickLibrary}
        stackLevel={1}
        nestedDismissGuard={variantDialogOpen || blockDismiss}
        onPick={(item, kind) => handlePick(item, kind)}
      />
      {pendingPick ? (
        <PosProductVariantDialog
          open={variantDialogOpen}
          onOpenChange={closeVariantDialogSafely}
          productName={pendingPick.item.displayName}
          options={pendingPick.options}
          stackLevel={2}
          onConfirm={(selection) => {
            confirmVariantSelection(selection)
            setItemOpen(false)
          }}
        />
      ) : null}
    </>
  )
}
