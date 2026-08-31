import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  type LibraryProductVariant,
} from '../services/dataLibraryApi'
import {
  AI_PRODUCT_VARIANTS_CHANGED_EVENT,
  CompanyProductVariantsAiMenu,
} from './CompanyProductVariantsAiMenu'

type CompanyProductVariantsTabProps = {
  /** Company catalog product id (used for variant detail navigation). */
  productId: string
  productName: string
  libraryEntityId: string | null
  canEdit: boolean
}

export function CompanyProductVariantsTab({
  productId,
  productName,
  libraryEntityId,
  canEdit,
}: CompanyProductVariantsTabProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const [items, setItems] = useState<LibraryProductVariant[]>([])
  const [loading, setLoading] = useState(Boolean(libraryEntityId))
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<LibraryProductVariant | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!libraryEntityId) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await dataLibraryApi.listProductVariants(libraryEntityId)
      setItems(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantsTab.failedLoad'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [libraryEntityId, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    function onVariantsChanged() {
      void load()
    }
    window.addEventListener(AI_PRODUCT_VARIANTS_CHANGED_EVENT, onVariantsChanged)
    return () => window.removeEventListener(AI_PRODUCT_VARIANTS_CHANGED_EVENT, onVariantsChanged)
  }, [load])

  async function handleDeleteVariant(variant: LibraryProductVariant) {
    if (!libraryEntityId) return
    setBusy(true)
    setError(null)
    try {
      await dataLibraryApi.deleteProductVariant(libraryEntityId, variant.id)
      setPendingDelete(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('variantDetail.deleteFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-foreground">{t('variantsTab.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {libraryEntityId ? t('variantsTab.librarySkus') : t('variantsTab.linkedOnly')}
          </p>
        </div>
        {canEdit && libraryEntityId ? (
          <CompanyProductVariantsAiMenu
            libraryEntityId={libraryEntityId}
            entityName={productName}
          />
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!libraryEntityId ? (
        <ItemListEmpty>{t('variantsTab.noLibraryProduct')}</ItemListEmpty>
      ) : loading && items.length === 0 ? (
        <ItemListEmpty>{t('variantsTab.loading')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('variantsTab.empty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {items.map((variant) => {
            const rowBody = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{variant.name}</p>
                  {variant.isDefault ? (
                    <StatusTag variant="verified" className="shrink-0">
                      {t('variantDetail.variantCard.default')}
                    </StatusTag>
                  ) : null}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {t('variantsTab.sku', { sku: variant.sku })}
                </p>
                {variant.values.length > 0 ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {variant.values
                      .map(
                        (value) =>
                          `${value.attributeName}: ${formatLibraryAttributeValueLabel(value, value.unitSymbol)}`,
                      )
                      .join(' · ')}
                  </p>
                ) : null}
              </>
            )
            return (
              <ItemListItem key={variant.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() =>
                      navigate(`/data/products/${productId}/variants/${variant.id}`)
                    }
                  >
                    {rowBody}
                  </button>
                </ItemListContent>
                {canEdit && !variant.isDefault ? (
                  <ItemListMenu
                    ariaLabel={t('variantsTab.actionsFor', { name: variant.name })}
                  >
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={busy}
                      onClick={() => setPendingDelete(variant)}
                    >
                      {tc('delete')}
                    </DropdownMenuItem>
                  </ItemListMenu>
                ) : null}
              </ItemListItem>
            )
          })}
        </ItemList>
      )}

      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete
            ? t('variantDetail.deleteConfirm', { name: pendingDelete.name })
            : t('variantDetail.deleteConfirmFallback')
        }
        description={t('variantDetail.deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('delete')}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) {
            void handleDeleteVariant(pendingDelete)
          }
        }}
      />
    </div>
  )
}
