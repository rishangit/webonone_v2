import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  CustomDialog,
  FormField,
  NativeSelect,
  RadioGroup,
  RadioGroupItem,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { mapZodIssuesToFieldErrors } from '@/features/data/schemas/dataSchemas'
import {
  EMPTY_PRODUCT_VARIANT_WIZARD_VALUES,
  generateVariantSku,
  multiValueAttributes,
  productVariantWizardStep1Schema,
  productVariantWizardStep2Schema,
  suggestVariantName,
  toCreateProductVariantPayload,
  type ProductVariantWizardFormValues,
  type ProductVariantWizardStep,
} from '@/features/data/schemas/productVariantSchemas'
import { dataAdminApi } from '@/shared/services/dataAdminApi'
import type { CatalogAttributeValue } from '@/shared/types/data.types'

const TOTAL_STEPS = 3

export function ProductVariantFormDialog({
  open,
  productId,
  productName,
  attributes,
  hasDefaultVariant,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  productId: string
  productName: string
  attributes: CatalogAttributeValue[]
  hasDefaultVariant: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [step, setStep] = useState<ProductVariantWizardStep>(1)
  const [values, setValues] = useState<ProductVariantWizardFormValues>(EMPTY_PRODUCT_VARIANT_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [saving, setSaving] = useState(false)

  const multi = useMemo(() => multiValueAttributes(attributes), [attributes])

  useEffect(() => {
    if (!open) return
    setStep(1)
    setFieldErrors({})
    setValues({
      ...EMPTY_PRODUCT_VARIANT_WIZARD_VALUES,
      kind: hasDefaultVariant ? 'custom' : 'default',
    })
  }, [open, hasDefaultVariant])

  function validateStep(currentStep: ProductVariantWizardStep): boolean {
    if (currentStep === 1) {
      const parsed = productVariantWizardStep1Schema(attributes).safeParse(values)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    if (currentStep === 2) {
      const parsed = productVariantWizardStep2Schema.safeParse(values)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    setFieldErrors({})
    return true
  }

  async function handleSubmit() {
    if (!validateStep(step)) return
    setSaving(true)
    try {
      await dataAdminApi.createProductVariant(productId, toCreateProductVariantPayload(values, attributes))
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast({
        title: t('variant.addTitle'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const stepTitle =
    step === 1 ? t('variant.wizardStepType') : step === 2 ? t('variant.wizardStepIdentity') : t('variant.wizardStepSummary')

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('variant.addTitle')}
      description={t('stepOf', { current: step, total: TOTAL_STEPS, title: stepTitle })}
      sizeWidth="large"
      sizeHeight="xlarge"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          {step > 1 ? (
            <Button
              variant="outline"
              onPress={() => setStep((current) => (current === 1 ? 1 : ((current - 1) as ProductVariantWizardStep)))}
            >
              {tc('previous')}
            </Button>
          ) : null}
          {step < TOTAL_STEPS ? (
            <Button
              onPress={() => {
                if (validateStep(step)) {
                  setStep((current) => (current === 3 ? 3 : ((current + 1) as ProductVariantWizardStep)))
                }
              }}
            >
              {tc('next')}
            </Button>
          ) : (
            <Button onPress={() => void handleSubmit()} disabled={saving}>
              {saving ? t('saving') : t('variant.addTitle')}
            </Button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <View className="gap-4">
          <FormField label={t('variant.typeLegend')} error={fieldErrors.kind}>
            <RadioGroup
              value={values.kind}
              onValueChange={(kind) =>
                setValues((current) => ({
                  ...current,
                  kind: kind === 'custom' ? 'custom' : 'default',
                }))
              }
            >
              <RadioGroupItem
                value="default"
                label={t('variant.default')}
                disabled={hasDefaultVariant}
              />
              <RadioGroupItem value="custom" label={t('variant.custom')} />
            </RadioGroup>
          </FormField>
          {values.kind === 'default' ? (
            <Body className="text-sm text-muted">
              {hasDefaultVariant ? t('variant.defaultExists') : t('variant.defaultHint')}
            </Body>
          ) : multi.length === 0 ? (
            <Body className="text-sm text-muted">{t('variant.noMultiValues')}</Body>
          ) : (
            multi.map((attr) => (
              <NativeSelect
                key={attr.attributeId}
                label={attr.name}
                required
                error={fieldErrors[`selectedValueByAttributeId.${attr.attributeId}`]}
                value={values.selectedValueByAttributeId[attr.attributeId] ?? ''}
                onValueChange={(valueId) =>
                  setValues((current) => ({
                    ...current,
                    selectedValueByAttributeId: {
                      ...current.selectedValueByAttributeId,
                      [attr.attributeId]: valueId,
                    },
                  }))
                }
                placeholder={t('variant.selectValue')}
                options={attr.values.map((value) => ({
                  label: `${value.valueText ?? value.valueNumber ?? '—'}${value.isDefault ? t('variant.defaultSuffix') : ''}`,
                  value: value.id,
                }))}
              />
            ))
          )}
        </View>
      ) : null}

      {step === 2 ? (
        <View className="gap-4">
          <FormField label={t('variant.nameLabel')} required error={fieldErrors.name}>
            <TextField
              value={values.name}
              onChangeText={(name) => setValues((current) => ({ ...current, name }))}
            />
          </FormField>
          <Button
            variant="outline"
            size="sm"
            onPress={() =>
              setValues((current) => ({
                ...current,
                name: suggestVariantName(current, attributes),
              }))
            }
          >
            {t('variant.suggest')}
          </Button>
          <FormField label={t('variant.sku')} required error={fieldErrors.sku}>
            <TextField
              value={values.sku}
              onChangeText={(sku) => setValues((current) => ({ ...current, sku }))}
            />
          </FormField>
          <Button
            variant="outline"
            size="sm"
            onPress={() =>
              setValues((current) => ({
                ...current,
                sku: generateVariantSku(productName),
              }))
            }
          >
            {t('variant.generate')}
          </Button>
        </View>
      ) : null}

      {step === 3 ? (
        <View className="gap-2">
          <Body className="font-medium">{values.name}</Body>
          <Body className="text-sm text-muted">{t('variant.skuLine', { sku: values.sku })}</Body>
          <Body className="text-sm text-muted">
            {values.kind === 'default' ? t('variant.default') : t('variant.custom')}
          </Body>
        </View>
      ) : null}
    </CustomDialog>
  )
}
