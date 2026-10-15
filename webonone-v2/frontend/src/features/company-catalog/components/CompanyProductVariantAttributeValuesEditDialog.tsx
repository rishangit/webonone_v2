import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import {
  initialSelectedLibraryValueIds,
  isDuplicateCompanyVariantCombination,
  multiValueCompanyCatalogAttributes,
  resolveCompanyVariantLibraryValueIds,
  validateCompanyVariantAttributeSelection,
} from '@/features/company-catalog/schemas/companyProductVariantAttributeSchemas'
import {
  companyCatalogApi,
  type CompanyCatalogAttribute,
  type CompanyCatalogVariant,
} from '@/features/company-catalog/services/companyCatalogApi'
import { formatLibraryAttributeValueLabel } from '@/features/company-catalog/services/dataLibraryApi'

export function CompanyProductVariantAttributeValuesEditDialog({
  open,
  productId,
  variant,
  attributes,
  existingVariants,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  productId: string
  variant: CompanyCatalogVariant
  attributes: CompanyCatalogAttribute[]
  existingVariants: CompanyCatalogVariant[]
  onOpenChange: (open: boolean) => void
  onSaved: (variant: CompanyCatalogVariant) => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const multi = useMemo(() => multiValueCompanyCatalogAttributes(attributes), [attributes])
  const [selectedByAttributeId, setSelectedByAttributeId] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [combinationError, setCombinationError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedByAttributeId(initialSelectedLibraryValueIds(variant))
    setFieldErrors({})
    setCombinationError(null)
  }, [open, variant])

  async function handleSave() {
    setCombinationError(null)
    const errors = validateCompanyVariantAttributeSelection(attributes, selectedByAttributeId)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    if (
      isDuplicateCompanyVariantCombination(
        attributes,
        selectedByAttributeId,
        existingVariants,
        variant.id,
      )
    ) {
      setCombinationError(t('variantDetail.attributeValues.duplicateCombination'))
      return
    }
    setSaving(true)
    try {
      const libraryValueIds = resolveCompanyVariantLibraryValueIds(attributes, selectedByAttributeId)
      const updated = await companyCatalogApi.updateCopiedVariantAttributeValues(
        productId,
        variant.id,
        libraryValueIds,
      )
      onSaved(updated)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('variantDetail.attributeValues.saveFailed')
      if (message.includes('attribute combination already exists')) {
        setCombinationError(t('variantDetail.attributeValues.duplicateCombination'))
      } else {
        setCombinationError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('variantDetail.attributeValues.editTitle')}
      description={t('variantDetail.attributeValues.description')}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {tc('cancel')}
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {tc('save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {combinationError ? (
          <Alert variant="destructive">
            <AlertDescription>{combinationError}</AlertDescription>
          </Alert>
        ) : null}
        {multi.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('variantDetail.attributeValues.empty')}</p>
        ) : (
          multi.map((attribute) => {
            const errorKey = `selected.${attribute.attributeId}`
            const selected = selectedByAttributeId[attribute.attributeId] ?? ''
            return (
              <FormField
                key={attribute.attributeId}
                label={attribute.name}
                htmlFor={`variant-attr-${attribute.attributeId}`}
                required
                error={
                  fieldErrors[errorKey] === 'required'
                    ? tc('required')
                    : fieldErrors[errorKey]
                }
              >
                <Select
                  value={selected || undefined}
                  onValueChange={(libraryValueId) => {
                    setCombinationError(null)
                    setSelectedByAttributeId((current) => ({
                      ...current,
                      [attribute.attributeId]: libraryValueId,
                    }))
                  }}
                  disabled={saving}
                >
                  <SelectTrigger id={`variant-attr-${attribute.attributeId}`} className="w-full">
                    <SelectValue placeholder={t('variantDetail.attributeValues.selectValue')} />
                  </SelectTrigger>
                  <SelectContent>
                    {attribute.values.map((value) => {
                      const libraryValueId = value.libraryValueId ?? value.id
                      return (
                        <SelectItem key={value.id} value={libraryValueId}>
                          {formatLibraryAttributeValueLabel(value, attribute.unit?.symbol)}
                          {value.isDefault ? ` (${t('attributeDetail.values.default')})` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </FormField>
            )
          })
        )}
      </div>
    </CustomDialog>
  )
}
