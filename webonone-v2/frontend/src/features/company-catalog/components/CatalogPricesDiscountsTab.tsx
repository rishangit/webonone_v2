import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  PriceDisplay,
  StatusTag,
  useToast,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CatalogDiscountFormDialog } from '@/features/company-catalog/components/CatalogDiscountFormDialog'
import { CatalogPriceFormDialog } from '@/features/company-catalog/components/CatalogPriceFormDialog'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import type {
  CatalogDiscount,
  CatalogDiscountKind,
  CatalogPrice,
} from '@/features/company-catalog/types/catalogPricing.types'
import {
  formatCatalogDiscountWhen,
  formatCatalogDiscountWhom,
  formatPercentLabel,
} from '@/features/company-catalog/utils/resolveApplicableCatalogPrice'

type CatalogPricesDiscountsTabProps = {
  kind: CatalogDiscountKind
  entityId: string
  prices: CatalogPrice[]
  discounts: CatalogDiscount[]
  loading: boolean
  error: string | null
  canEdit: boolean
  /** Products discount a variant’s active stock price and do not list prices. */
  showPrices?: boolean
  variants?: Array<{ id: string; name: string }>
  onChanged: () => void
}

type PendingRemove =
  | { kind: 'price'; item: CatalogPrice }
  | { kind: 'discount'; item: CatalogDiscount }
  | null

export function CatalogPricesDiscountsTab({
  kind,
  entityId,
  prices,
  discounts,
  loading,
  error,
  canEdit,
  showPrices = true,
  variants = [],
  onChanged,
}: CatalogPricesDiscountsTabProps) {
  const { t, i18n } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [priceDialog, setPriceDialog] = useState<CatalogPrice | null | undefined>(undefined)
  const [discountDialog, setDiscountDialog] = useState<CatalogDiscount | null | undefined>(undefined)
  const [pendingRemove, setPendingRemove] = useState<PendingRemove>(null)
  const [busy, setBusy] = useState(false)

  async function handleSetActive(price: CatalogPrice) {
    if (kind === 'products' || price.isActive || busy) return
    setBusy(true)
    try {
      await companyCatalogApi.activatePrice(kind, entityId, price.id)
      toast({ title: t('priceList.activeUpdated') })
      onChanged()
    } catch (err) {
      toast({
        title: t('priceList.activeFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!pendingRemove) return
    setBusy(true)
    try {
      if (pendingRemove.kind === 'price') {
        if (kind === 'products') return
        await companyCatalogApi.deletePrice(kind, entityId, pendingRemove.item.id)
        toast({ title: t('priceList.priceRemoved') })
      } else {
        await companyCatalogApi.deleteDiscount(kind, entityId, pendingRemove.item.id)
        toast({ title: t('priceList.discountRemoved') })
      }
      onChanged()
    } catch (err) {
      const failed =
        pendingRemove.kind === 'price' ? t('priceList.priceRemoveFailed') : t('priceList.discountRemoveFailed')
      toast({
        title: failed,
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
      setPendingRemove(null)
    }
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showPrices ? (
      <Card variant="list">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">{t('priceList.pricesTitle')}</CardTitle>
            <CardDescription>{t('priceList.pricesDescription')}</CardDescription>
          </div>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              className="shrink-0"
              onClick={() => setPriceDialog(null)}
              disabled={busy || loading}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('priceList.addPrice')}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {loading && prices.length === 0 ? (
            <ItemListEmpty>{t('priceList.loadingPrices')}</ItemListEmpty>
          ) : prices.length === 0 ? (
            <ItemListEmpty>{t('priceList.emptyPrices')}</ItemListEmpty>
          ) : (
            <ItemList className="py-0">
              {prices.map((price) => (
                <ItemListItem key={price.id}>
                  <ItemListContent>
                    <div className="flex min-w-0 items-center gap-2">
                      <PriceDisplay value={price.price} size="sm" />
                      {price.isActive ? (
                        <StatusTag variant="verified" className="shrink-0">
                          {t('priceList.active')}
                        </StatusTag>
                      ) : null}
                    </div>
                  </ItemListContent>
                  {canEdit ? (
                    <ItemListMenu ariaLabel={t('priceList.actionsForPrice', { price: price.price })}>
                      <DropdownMenuItem disabled={busy} onClick={() => setPriceDialog(price)}>
                        {tc('edit')}
                      </DropdownMenuItem>
                      {!price.isActive ? (
                        <DropdownMenuItem disabled={busy} onClick={() => void handleSetActive(price)}>
                          {t('priceList.setActive')}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={busy}
                        onClick={() => setPendingRemove({ kind: 'price', item: price })}
                      >
                        {tc('remove')}
                      </DropdownMenuItem>
                    </ItemListMenu>
                  ) : null}
                </ItemListItem>
              ))}
            </ItemList>
          )}
        </CardContent>
      </Card>
      ) : null}

      <Card variant="list">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">{t('priceList.discountsTitle')}</CardTitle>
            <CardDescription>
              {kind === 'products'
                ? t('priceList.productDiscountsDescription')
                : t('priceList.discountsDescription')}
            </CardDescription>
          </div>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              className="shrink-0"
              onClick={() => setDiscountDialog(null)}
              disabled={busy || loading}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('priceList.addDiscount')}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {loading && discounts.length === 0 ? (
            <ItemListEmpty>{t('priceList.loadingDiscounts')}</ItemListEmpty>
          ) : discounts.length === 0 ? (
            <ItemListEmpty>{t('priceList.emptyDiscounts')}</ItemListEmpty>
          ) : (
            <ItemList className="py-0">
              {discounts.map((discount) => (
                <ItemListItem key={discount.id}>
                  <ItemListContent>
                    <p className="font-medium text-foreground">{formatPercentLabel(discount.percent)}%</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {kind === 'products' ? (
                        <>
                          {discount.applyVariants === 'selected'
                            ? discount.variants.map((variant) => variant.name).join(', ')
                            : t('priceList.allVariants')}
                          {' · '}
                        </>
                      ) : null}
                      {formatCatalogDiscountWhen(discount, t, i18n.language)}
                      {' · '}
                      {formatCatalogDiscountWhom(discount, t)}
                    </p>
                  </ItemListContent>
                  {canEdit ? (
                    <ItemListMenu
                      ariaLabel={t('priceList.actionsForDiscount', {
                        percent: formatPercentLabel(discount.percent),
                      })}
                    >
                      <DropdownMenuItem disabled={busy} onClick={() => setDiscountDialog(discount)}>
                        {tc('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={busy}
                        onClick={() => setPendingRemove({ kind: 'discount', item: discount })}
                      >
                        {tc('remove')}
                      </DropdownMenuItem>
                    </ItemListMenu>
                  ) : null}
                </ItemListItem>
              ))}
            </ItemList>
          )}
        </CardContent>
      </Card>

      {showPrices && kind !== 'products' ? (
        <CatalogPriceFormDialog
          open={priceDialog !== undefined}
          kind={kind}
          entityId={entityId}
          price={priceDialog ?? null}
          onOpenChange={(next) => {
            if (!next) setPriceDialog(undefined)
          }}
          onSaved={onChanged}
        />
      ) : null}
      <CatalogDiscountFormDialog
        open={discountDialog !== undefined}
        kind={kind}
        entityId={entityId}
        discount={discountDialog ?? null}
        variants={variants}
        onOpenChange={(next) => {
          if (!next) setDiscountDialog(undefined)
        }}
        onSaved={onChanged}
      />

      <PlatformAlertConfirmDialog
        open={pendingRemove !== null}
        title={
          pendingRemove?.kind === 'discount'
            ? t('priceList.removeDiscountTitle')
            : t('priceList.removePriceTitle')
        }
        description={
          pendingRemove?.kind === 'discount'
            ? t('priceList.removeDiscountDescription')
            : t('priceList.removePriceDescription')
        }
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('remove')}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
        onConfirm={() => {
          void handleRemove()
        }}
      />
    </div>
  )
}

type CatalogProductDiscountsTabProps = {
  productId: string
  discounts: CatalogDiscount[]
  loading: boolean
  error: string | null
  canEdit: boolean
  onChanged: () => void
}

export function CatalogProductDiscountsTab({
  productId,
  discounts,
  loading,
  error,
  canEdit,
  onChanged,
}: CatalogProductDiscountsTabProps) {
  const [variants, setVariants] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    let cancelled = false
    void companyCatalogApi
      .listCopiedVariants(productId)
      .then((result) => {
        if (cancelled) return
        setVariants(result.items.map((item) => ({ id: item.libraryVariantId, name: item.name })))
      })
      .catch(() => {
        if (!cancelled) setVariants([])
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  return (
    <CatalogPricesDiscountsTab
      kind="products"
      entityId={productId}
      prices={[]}
      discounts={discounts}
      loading={loading}
      error={error}
      canEdit={canEdit}
      showPrices={false}
      variants={variants}
      onChanged={onChanged}
    />
  )
}
