import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { ProductWizardProgress } from '@/features/products/components/product-wizard/ProductWizardProgress'
import { ProductVariantWizardStepIdentity } from '@/features/products/components/variant-wizard/ProductVariantWizardStepIdentity'
import { ProductVariantWizardStepSummary } from '@/features/products/components/variant-wizard/ProductVariantWizardStepSummary'
import { ProductVariantWizardStepType } from '@/features/products/components/variant-wizard/ProductVariantWizardStepType'
import {
  EMPTY_PRODUCT_VARIANT_WIZARD_VALUES,
  isDuplicateVariantCombination,
  parseProductVariantWizardStep,
  productVariantWizardStep1Schema,
  productVariantWizardStep2Schema,
  suggestVariantName,
  toCreateProductVariantPayload,
  type ProductVariantWizardFormValues,
  type ProductVariantWizardStep,
} from '@/features/products/schemas/productVariantSchemas'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogAttributeValue, ProductVariant } from '@/shared/types/data.types'

const TOTAL_STEPS = 3

const VARIANT_WIZARD_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

export interface ProductVariantFormDialogProps {
  open: boolean
  productId: string
  productName: string
  attributes: CatalogAttributeValue[]
  hasDefaultVariant: boolean
  /** Used to block creating the same attribute-value combination twice. */
  existingVariants?: ProductVariant[]
  onOpenChange: (open: boolean) => void
  onSaved: (item: ProductVariant) => void
  chrome?: 'dialog' | 'embed-page'
}

function flattenZodFieldErrors(
  issues: ReadonlyArray<{ path: readonly PropertyKey[]; message: string }>,
): Record<string, string> {
  const normalized = issues.map((issue) => ({
    path: issue.path.filter((p): p is string | number => typeof p === 'string' || typeof p === 'number'),
    message: issue.message,
  }))
  const mapped = mapZodIssuesToFieldErrors(normalized)
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(mapped)) {
    if (value) result[key] = value
  }
  for (const issue of normalized) {
    if (issue.path.length > 1) {
      result[issue.path.map(String).join('.')] = issue.message
    }
  }
  return result
}

export function ProductVariantFormDialog({
  open,
  productId,
  productName,
  attributes,
  hasDefaultVariant,
  existingVariants = [],
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: ProductVariantFormDialogProps) {
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const title = t('variant.addTitle')
  const embedStep =
    chrome === 'embed-page'
      ? parseProductVariantWizardStep(searchParams.get('step'))
      : 1
  const path = `/embed/dialogs/products/${productId}/variants/create`
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null
  const stepTitles = [
    t('variant.wizardStepType'),
    t('variant.wizardStepIdentity'),
    t('variant.wizardStepSummary'),
  ]
  const stepDescriptions = [
    t('variant.descType'),
    t('variant.descIdentity'),
    t('variant.descSummary'),
  ]

  const [step, setStep] = useState<ProductVariantWizardStep>(embedStep)
  const [values, setValues] = useState<ProductVariantWizardFormValues>(() => ({
    ...EMPTY_PRODUCT_VARIANT_WIZARD_VALUES,
    kind: hasDefaultVariant ? 'custom' : 'default',
  }))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const primaryLabelForStep = (current: ProductVariantWizardStep, isSaving: boolean) => {
    if (isSaving) return t('saving')
    if (current < TOTAL_STEPS) return tc('next')
    return t('variant.addTitle')
  }

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path,
    title,
    description: stepDescriptions[embedStep - 1],
    submitLabel: primaryLabelForStep(embedStep, false),
    secondaryLabel: embedStep > 1 ? tc('previous') : undefined,
    ...VARIANT_WIZARD_DIALOG_SIZE,
    onResult: () => {
      onSaved({} as ProductVariant)
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    const nextStep = chrome === 'embed-page' ? embedStep : 1
    setStep(nextStep)
    setFieldErrors({})
    setError(null)
    setValues({
      ...EMPTY_PRODUCT_VARIANT_WIZARD_VALUES,
      kind: hasDefaultVariant ? 'custom' : 'default',
    })
  }, [chrome, embedStep, hasDefaultVariant, open])

  function patchValues(patch: Partial<ProductVariantWizardFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function validateStep(current: ProductVariantWizardStep): boolean {
    if (current === 1) {
      if (values.kind === 'default' && hasDefaultVariant) {
        setFieldErrors({ kind: 'A default variant already exists for this product.' })
        return false
      }
      const result = productVariantWizardStep1Schema(attributes).safeParse({
        kind: values.kind,
        selectedValueByAttributeId: values.selectedValueByAttributeId,
      })
      if (!result.success) {
        setFieldErrors(flattenZodFieldErrors(result.error.issues))
        return false
      }
      if (isDuplicateVariantCombination(values, attributes, existingVariants)) {
        setFieldErrors({
          kind: 'A variant with this attribute combination already exists.',
        })
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 2) {
      const result = productVariantWizardStep2Schema.safeParse({
        name: values.name,
        sku: values.sku,
      })
      if (!result.success) {
        setFieldErrors(flattenZodFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    return true
  }

  function handleNext() {
    if (!validateStep(step)) return
    if (step < TOTAL_STEPS) {
      const next = (step + 1) as ProductVariantWizardStep
      if (step === 1 && !values.name.trim()) {
        setValues((prev) => ({
          ...prev,
          name: suggestVariantName(prev, attributes),
        }))
      }
      setStep(next)
    }
  }

  function handlePrevious() {
    setFieldErrors({})
    setError(null)
    if (step > 1) {
      setStep((step - 1) as ProductVariantWizardStep)
    }
  }

  async function handleSubmit() {
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await dataApi.createProductVariant(
        productId,
        toCreateProductVariantPayload(values, attributes),
      )
      onSaved(created)
      if (chrome === 'dialog') {
        onOpenChange(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create variant')
    } finally {
      setSaving(false)
    }
  }

  function handlePrimaryAction() {
    if (step < TOTAL_STEPS) {
      handleNext()
      return
    }
    void handleSubmit()
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      handlePrimaryAction()
    },
    onSecondary: () => {
      if (saving) return
      handlePrevious()
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      saving,
      primaryLabelForStep(step, saving),
      {
        description: stepDescriptions[step - 1],
        secondaryLabel: step > 1 ? tc('previous') : null,
      },
    )
  }, [chrome, dialogRequestId, parentOrigin, saving, step])

  const stepIndex = step - 1
  const isSubmitting = saving

  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting}
      >
        {tc('cancel')}
      </Button>
      {step > 1 ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={handlePrevious}
          disabled={isSubmitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {tc('previous')}
        </Button>
      ) : null}
      {step < TOTAL_STEPS ? (
        <Button type="button" className="h-10 px-4" onClick={handleNext} disabled={isSubmitting}>
          {tc('next')}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          className="h-10"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? t('saving') : t('variant.addTitle')}
        </Button>
      )}
    </div>
  )

  const body = (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('stepOf', { current: step, total: TOTAL_STEPS, title: stepTitles[stepIndex] })}
        </p>
        <ProductWizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? (
        <ProductVariantWizardStepType
          values={values}
          attributes={attributes}
          hasDefaultVariant={hasDefaultVariant}
          fieldErrors={fieldErrors}
          isSubmitting={isSubmitting}
          onChange={patchValues}
        />
      ) : null}

      {step === 2 ? (
        <ProductVariantWizardStepIdentity
          values={values}
          productName={productName}
          attributes={attributes}
          fieldErrors={fieldErrors}
          isSubmitting={isSubmitting}
          onChange={patchValues}
        />
      ) : null}

      {step === 3 ? (
        <ProductVariantWizardStepSummary values={values} attributes={attributes} />
      ) : null}
    </div>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }

  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={stepDescriptions[stepIndex]}
      sizeWidth={VARIANT_WIZARD_DIALOG_SIZE.sizeWidth}
      sizeHeight={VARIANT_WIZARD_DIALOG_SIZE.sizeHeight}
      footer={footer}
    >
      {body}
    </CustomDialog>
  )
}
