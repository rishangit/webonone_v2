import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EditableSectionCard, ReadOnlyField, useToast } from '@webonone/ui-kit'
import { CompanyProductVariantAttributeValuesEditDialog } from '@/features/company-catalog/components/CompanyProductVariantAttributeValuesEditDialog'
import {
  companyCatalogApi,
  type CompanyCatalogAttribute,
  type CompanyCatalogVariant,
} from '@/features/company-catalog/services/companyCatalogApi'
import { formatLibraryAttributeValueLabel } from '@/features/company-catalog/services/dataLibraryApi'

export function CompanyProductVariantAttributeValuesCard({
  productId,
  variant,
  canEdit,
  onVariantUpdated,
}: {
  productId: string
  variant: CompanyCatalogVariant
  canEdit: boolean
  onVariantUpdated: (variant: CompanyCatalogVariant) => void
}) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const [attributes, setAttributes] = useState<CompanyCatalogAttribute[]>([])
  const [existingVariants, setExistingVariants] = useState<CompanyCatalogVariant[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const [attributeResult, variantResult] = await Promise.all([
        companyCatalogApi.listCopiedAttributes('products', productId),
        companyCatalogApi.listCopiedVariants(productId),
      ])
      setAttributes(attributeResult.attributes)
      setExistingVariants(variantResult.items)
    } catch {
      setAttributes([])
      setExistingVariants([])
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  return (
    <>
      <EditableSectionCard
        title={t('variantDetail.attributeValues.title')}
        description={t('variantDetail.attributeValues.description')}
        canEdit={canEdit && !loading}
        onEdit={() => setEditOpen(true)}
        editAriaLabel={t('variantDetail.attributeValues.editTitle')}
      >
        {variant.values.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('variantDetail.attributeValues.empty')}</p>
        ) : (
          <div className="space-y-4">
            {variant.values.map((value) => (
              <ReadOnlyField
                key={`${value.attributeId}-${value.libraryValueId}`}
                label={value.attributeName}
                value={formatLibraryAttributeValueLabel(value, value.unitSymbol)}
              />
            ))}
          </div>
        )}
      </EditableSectionCard>
      <CompanyProductVariantAttributeValuesEditDialog
        open={editOpen}
        productId={productId}
        variant={variant}
        attributes={attributes}
        existingVariants={existingVariants}
        onOpenChange={setEditOpen}
        onSaved={(updated) => {
          onVariantUpdated(updated)
          toast({ title: t('variantDetail.attributeValues.saved') })
        }}
      />
    </>
  )
}
