import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  StatusTag,
} from '@webonone/ui-kit'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  type LibraryProductVariant,
} from '../services/dataLibraryApi'

type CompanyProductVariantsTabProps = {
  /** Company catalog product id (used for variant detail navigation). */
  productId: string
  libraryEntityId: string | null
}

export function CompanyProductVariantsTab({
  productId,
  libraryEntityId,
}: CompanyProductVariantsTabProps) {
  const { t } = useTranslation('catalog')
  const navigate = useNavigate()
  const [items, setItems] = useState<LibraryProductVariant[]>([])
  const [loading, setLoading] = useState(Boolean(libraryEntityId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!libraryEntityId) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await dataLibraryApi.listProductVariants(libraryEntityId)
        if (cancelled) return
        setItems(result.items)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : t('variantsTab.failedLoad'))
        setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [libraryEntityId, t])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-foreground">{t('variantsTab.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {libraryEntityId ? t('variantsTab.librarySkus') : t('variantsTab.linkedOnly')}
        </p>
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
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </div>
  )
}
