import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  isPlatformPeerDialogNestedCancelMessage,
  isPlatformPeerDialogNestedResultMessage,
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogNestedRequest,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  mapZodIssuesToFieldErrors,
  Spinner,
  type SelectTagValue,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  ATTRIBUTE_SELECT_EMBED_PATH,
  ATTRIBUTE_SELECT_PEER,
  AttributeSelectStackedDialogs,
  writeAttributeSelectSession,
  type AttributeSelectValue,
} from '@/features/attributes/components/AttributeSelectField'
import { productsActions } from '@/features/products/store'
import {
  EMPTY_PRODUCT_WIZARD_VALUES,
  parseProductWizardStep,
  productWizardStep1Schema,
  productWizardStep2Schema,
  productWizardStep3Schema,
  toCreateProductPayload,
  type ProductAttributeRow,
  type ProductWizardFormValues,
  type ProductWizardStep,
} from '@/features/products/schemas/productSchemas'
import { ProductWizardProgress } from '@/features/products/components/product-wizard/ProductWizardProgress'
import { ProductWizardStepBasics } from '@/features/products/components/product-wizard/ProductWizardStepBasics'
import { ProductWizardStepTags } from '@/features/products/components/product-wizard/ProductWizardStepTags'
import { ProductWizardStepAttributes } from '@/features/products/components/product-wizard/ProductWizardStepAttributes'
import { ProductWizardStepSummary } from '@/features/products/components/product-wizard/ProductWizardStepSummary'
import {
  createNestedRequestId,
  TAG_SELECT_EMBED_PATH,
  TagSelectStackedDialogs,
  writeTagSelectSession,
} from '@/features/tags/components/TagSelectField'
import { useEpicCatalogEditor } from '@/shared/hooks/useEpicCatalogEditor'
import type { CatalogItem } from '@/shared/types/data.types'

const TOTAL_STEPS = 4

const PRODUCT_WIZARD_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
}

const TAG_PICKER_PEER_SIZE = {
  sizeWidth: 'small' as const,
  sizeHeight: 'large' as const,
}

const STEP_TITLES = ['Basics', 'Tags', 'Attributes', 'Summary'] as const
const STEP_DESCRIPTIONS = [
  'Name and describe this product.',
  'Optionally label this product with tags.',
  'Optionally select attributes for this product.',
  'Review your details before saving.',
] as const

function isSelectTagValue(value: unknown): value is SelectTagValue {
  if (!value || typeof value !== 'object') return false
  const tag = value as Record<string, unknown>
  return (
    typeof tag.id === 'string' &&
    typeof tag.name === 'string' &&
    typeof tag.color === 'string'
  )
}

function parseTagsPayload(payload: unknown): SelectTagValue[] | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (!Array.isArray(record.tags)) return null
  return record.tags.filter(isSelectTagValue)
}

function isAttributeSelectValue(value: unknown): value is AttributeSelectValue {
  if (!value || typeof value !== 'object') return false
  const attribute = value as Record<string, unknown>
  const unit = attribute.unit
  const unitOk =
    unit === null ||
    unit === undefined ||
    (Boolean(unit) &&
      typeof unit === 'object' &&
      typeof (unit as { id?: unknown }).id === 'string' &&
      typeof (unit as { name?: unknown }).name === 'string' &&
      typeof (unit as { symbol?: unknown }).symbol === 'string')
  return (
    typeof attribute.id === 'string' &&
    typeof attribute.name === 'string' &&
    (attribute.valueType === 'number' || attribute.valueType === 'text') &&
    unitOk
  )
}

function parseAttributesPayload(payload: unknown): AttributeSelectValue[] | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (!Array.isArray(record.attributes)) return null
  return record.attributes.filter(isAttributeSelectValue)
}

function appendAttributeSelection(
  previous: ProductAttributeRow[],
  selected: AttributeSelectValue[],
): ProductAttributeRow[] {
  const result = [...previous]
  const seen = new Set(previous.map((row) => row.attributeId))
  for (const attribute of selected) {
    if (seen.has(attribute.id)) continue
    seen.add(attribute.id)
    result.push({
      attributeId: attribute.id,
      name: attribute.name,
      valueType: attribute.valueType,
      unit: attribute.unit ?? null,
      valueText: '',
      valueNumber: '',
    })
  }
  return result
}

function valuesFromCatalogItem(item: CatalogItem): ProductWizardFormValues {
  return {
    name: item.name,
    description: item.description ?? '',
    status: item.status,
    tags: item.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    attributes: item.attributes.map((a) => ({
      attributeId: a.attributeId,
      name: a.name,
      valueType: a.valueType,
      unit: a.unit,
      valueText: '',
      valueNumber: '',
    })),
  }
}

export interface ProductFormDialogProps {
  open: boolean
  id?: string
  initialStep?: ProductWizardStep
  onOpenChange: (open: boolean) => void
  onSaved: (item?: CatalogItem) => void
  chrome?: 'dialog' | 'embed-page'
}

export function ProductFormDialog({
  open,
  id,
  initialStep = 1,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: ProductFormDialogProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isNew = !id
  const title = isNew ? 'Create product' : 'Edit product'
  const embedStep =
    chrome === 'embed-page'
      ? parseProductWizardStep(searchParams.get('step'))
      : initialStep
  const stepQuery = embedStep > 1 ? `?step=${embedStep}` : ''
  const path = isNew
    ? `/embed/dialogs/products/create${stepQuery}`
    : `/embed/dialogs/products/${id}/edit${stepQuery}`
  const finalSubmitLabel = isNew ? 'Create product' : 'Save changes'
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const [step, setStep] = useState<ProductWizardStep>(embedStep)
  const [values, setValues] = useState<ProductWizardFormValues>(EMPTY_PRODUCT_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ProductWizardFormValues, string>>
  >({})
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [attributePickerOpen, setAttributePickerOpen] = useState(false)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const submittedRef = useRef(false)
  const seededDetailIdRef = useRef<string | null>(null)
  const tagPickerOpenRef = useRef(false)
  const attributePickerOpenRef = useRef(false)
  const blockOuterDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)
  const nestedTagRequestIdRef = useRef<string | null>(null)
  const nestedAttributeRequestIdRef = useRef<string | null>(null)

  const userRole = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const canSetStatus = userRole === 'super_admin'

  const editor = useEpicCatalogEditor(id, isNew, (s) => s.products, productsActions)
  const cachedDetail = useAppSelector((s) => s.products.detail)
  const detailForForm =
    !isNew && editor.detail && (editor.detail as CatalogItem).id === id
      ? (editor.detail as CatalogItem)
      : !isNew && cachedDetail?.id === id
        ? cachedDetail
        : null
  const showLoading = Boolean(!isNew && editor.loading && !detailForForm)

  const primaryLabelForStep = (current: ProductWizardStep, saving: boolean) => {
    if (saving) return 'Saving…'
    if (current < TOTAL_STEPS) return 'Next'
    return finalSubmitLabel
  }

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path,
    title,
    description: STEP_DESCRIPTIONS[embedStep - 1],
    submitLabel: primaryLabelForStep(embedStep, false),
    secondaryLabel: embedStep > 1 ? 'Previous' : undefined,
    ...PRODUCT_WIZARD_DIALOG_SIZE,
    onResult: () => {
      onSaved()
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    tagPickerOpenRef.current = tagPickerOpen
  }, [tagPickerOpen])

  useEffect(() => {
    attributePickerOpenRef.current = attributePickerOpen
  }, [attributePickerOpen])

  useEffect(() => {
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    const nextStep = chrome === 'embed-page' ? embedStep : initialStep
    setStep(nextStep)
    setFieldErrors({})
    seededDetailIdRef.current = null
    if (isNew) {
      setValues(EMPTY_PRODUCT_WIZARD_VALUES)
    }
  }, [chrome, embedStep, initialStep, isNew, open])

  useEffect(() => {
    if (!open || isNew || !detailForForm) return
    if (seededDetailIdRef.current === detailForForm.id) return
    seededDetailIdRef.current = detailForForm.id
    setValues(valuesFromCatalogItem(detailForForm))
  }, [detailForForm, isNew, open])

  useEffect(() => {
    if (!open) {
      setTagPickerOpen(false)
      tagPickerOpenRef.current = false
      nestedTagRequestIdRef.current = null
      setAttributePickerOpen(false)
      attributePickerOpenRef.current = false
      nestedAttributeRequestIdRef.current = null
      setBlockOuterDismiss(false)
      blockOuterDismissRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (!submittedRef.current || editor.saving) return
    submittedRef.current = false
    if (!editor.error) onSaved(editor.detail ?? undefined)
  }, [editor.saving, editor.error, editor.detail, onSaved])

  const scheduleBlockOuterDismiss = useCallback(() => {
    blockOuterDismissRef.current = true
    setBlockOuterDismiss(true)
    if (blockTimerRef.current !== null) {
      window.clearTimeout(blockTimerRef.current)
    }
    blockTimerRef.current = window.setTimeout(() => {
      blockOuterDismissRef.current = false
      setBlockOuterDismiss(false)
      blockTimerRef.current = null
    }, 150)
  }, [])

  const closeTagPicker = useCallback(() => {
    setTagPickerOpen(false)
    tagPickerOpenRef.current = false
    nestedTagRequestIdRef.current = null
    scheduleBlockOuterDismiss()
  }, [scheduleBlockOuterDismiss])

  const closeAttributePicker = useCallback(() => {
    setAttributePickerOpen(false)
    attributePickerOpenRef.current = false
    nestedAttributeRequestIdRef.current = null
    scheduleBlockOuterDismiss()
  }, [scheduleBlockOuterDismiss])

  const openTagPicker = useCallback(() => {
    if (chrome === 'embed-page' && parentOrigin && dialogRequestId) {
      const nestedRequestId = createNestedRequestId()
      nestedTagRequestIdRef.current = nestedRequestId
      writeTagSelectSession(nestedRequestId, values.tags)
      tagPickerOpenRef.current = true
      setTagPickerOpen(true)
      sendPlatformPeerDialogNestedRequest(parentOrigin, {
        parentRequestId: dialogRequestId,
        requestId: nestedRequestId,
        path: TAG_SELECT_EMBED_PATH,
        title: 'Select tags',
        description: 'Choose one or more tags, then click Done.',
        submitLabel: 'Done',
        ...TAG_PICKER_PEER_SIZE,
      })
      return
    }
    tagPickerOpenRef.current = true
    setTagPickerOpen(true)
  }, [chrome, dialogRequestId, parentOrigin, values.tags])

  const openAttributePicker = useCallback(() => {
    if (chrome === 'embed-page' && parentOrigin && dialogRequestId) {
      const nestedRequestId = createNestedRequestId()
      nestedAttributeRequestIdRef.current = nestedRequestId
      writeAttributeSelectSession(
        nestedRequestId,
        values.attributes.map((row) => ({
          id: row.attributeId,
          name: row.name,
          valueType: row.valueType,
          unit: row.unit,
        })),
      )
      attributePickerOpenRef.current = true
      setAttributePickerOpen(true)
      sendPlatformPeerDialogNestedRequest(parentOrigin, {
        parentRequestId: dialogRequestId,
        requestId: nestedRequestId,
        path: ATTRIBUTE_SELECT_EMBED_PATH,
        title: ATTRIBUTE_SELECT_PEER.title,
        description: ATTRIBUTE_SELECT_PEER.description,
        submitLabel: ATTRIBUTE_SELECT_PEER.submitLabel,
        sizeWidth: ATTRIBUTE_SELECT_PEER.sizeWidth,
        sizeHeight: ATTRIBUTE_SELECT_PEER.sizeHeight,
      })
      return
    }
    attributePickerOpenRef.current = true
    setAttributePickerOpen(true)
  }, [chrome, dialogRequestId, parentOrigin, values.attributes])

  const applyAttributeSelection = useCallback((selected: AttributeSelectValue[]) => {
    setValues((prev) => ({
      ...prev,
      attributes: appendAttributeSelection(prev.attributes, selected),
    }))
  }, [])

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }

      const nestedTagId = nestedTagRequestIdRef.current
      if (nestedTagId) {
        if (
          isPlatformPeerDialogNestedResultMessage(event.data) &&
          event.data.parentRequestId === dialogRequestId &&
          event.data.requestId === nestedTagId
        ) {
          const tags = parseTagsPayload(event.data.payload)
          if (tags) {
            setValues((prev) => ({ ...prev, tags }))
          }
          closeTagPicker()
          return
        }

        if (
          isPlatformPeerDialogNestedCancelMessage(event.data) &&
          event.data.parentRequestId === dialogRequestId &&
          event.data.requestId === nestedTagId
        ) {
          closeTagPicker()
          return
        }
      }

      const nestedAttributeId = nestedAttributeRequestIdRef.current
      if (nestedAttributeId) {
        if (
          isPlatformPeerDialogNestedResultMessage(event.data) &&
          event.data.parentRequestId === dialogRequestId &&
          event.data.requestId === nestedAttributeId
        ) {
          const attributes = parseAttributesPayload(event.data.payload)
          if (attributes) {
            applyAttributeSelection(attributes)
          }
          closeAttributePicker()
          return
        }

        if (
          isPlatformPeerDialogNestedCancelMessage(event.data) &&
          event.data.parentRequestId === dialogRequestId &&
          event.data.requestId === nestedAttributeId
        ) {
          closeAttributePicker()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [
    applyAttributeSelection,
    chrome,
    closeAttributePicker,
    closeTagPicker,
    dialogRequestId,
    parentOrigin,
  ])

  function patchValues(patch: Partial<ProductWizardFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function removeAttribute(attributeId: string) {
    setValues((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((row) => row.attributeId !== attributeId),
    }))
  }

  function validateStep(current: ProductWizardStep): boolean {
    if (current === 1) {
      const result = productWizardStep1Schema.safeParse({
        name: values.name,
        description: values.description,
        status: values.status,
      })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 2) {
      const result = productWizardStep2Schema.safeParse({
        tag_ids: values.tags.map((tag) => tag.id),
      })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 3) {
      const result = productWizardStep3Schema.safeParse({
        attributes: values.attributes,
      })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
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
      setStep((step + 1) as ProductWizardStep)
    }
  }

  function handlePrevious() {
    setFieldErrors({})
    if (step > 1) {
      setStep((step - 1) as ProductWizardStep)
    }
  }

  function handleSubmit() {
    const step1 = productWizardStep1Schema.safeParse({
      name: values.name,
      description: values.description,
      status: values.status,
    })
    if (!step1.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(step1.error.issues))
      setStep(1)
      return
    }

    setFieldErrors({})
    submittedRef.current = true
    editor.save(
      toCreateProductPayload(values, {
        canSetStatus,
      }),
    )
  }

  function handlePrimaryAction() {
    if (step < TOTAL_STEPS) {
      handleNext()
      return
    }
    handleSubmit()
  }

  const nestedPickerOpen = tagPickerOpen || attributePickerOpen

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      if (tagPickerOpenRef.current || attributePickerOpenRef.current) {
        return
      }
      handlePrimaryAction()
    },
    onSecondary: () => {
      if (tagPickerOpenRef.current || attributePickerOpenRef.current || editor.saving) {
        return
      }
      handlePrevious()
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      editor.saving || nestedPickerOpen,
      primaryLabelForStep(step, editor.saving),
      {
        description: STEP_DESCRIPTIONS[step - 1],
        secondaryLabel: step > 1 ? 'Previous' : null,
      },
    )
  }, [
    chrome,
    dialogRequestId,
    editor.saving,
    nestedPickerOpen,
    parentOrigin,
    step,
    finalSubmitLabel,
  ])

  function handleFormOpenChange(next: boolean) {
    if (next) return
    if (tagPickerOpenRef.current || tagPickerOpen) {
      closeTagPicker()
      return
    }
    if (attributePickerOpenRef.current || attributePickerOpen) {
      closeAttributePicker()
      return
    }
    if (blockOuterDismissRef.current || blockOuterDismiss) {
      return
    }
    onOpenChange(false)
  }

  const stepIndex = step - 1
  const isSubmitting = editor.saving
  const selectedAttributeValues = useMemo(
    () =>
      values.attributes.map((row) => ({
        id: row.attributeId,
        name: row.name,
        valueType: row.valueType,
        unit: row.unit,
      })),
    [values.attributes],
  )

  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
        onClick={() => handleFormOpenChange(false)}
        disabled={isSubmitting}
      >
        Cancel
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
          Previous
        </Button>
      ) : null}
      {step < TOTAL_STEPS ? (
        <Button
          type="button"
          className="h-10 px-4"
          onClick={handleNext}
          disabled={isSubmitting || showLoading || nestedPickerOpen}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          className="h-10"
          onClick={handleSubmit}
          disabled={isSubmitting || showLoading || nestedPickerOpen}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Saving…' : finalSubmitLabel}
        </Button>
      )}
    </div>
  )

  const body = showLoading ? (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner size="lg" />
    </div>
  ) : (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {step} of {TOTAL_STEPS} — {STEP_TITLES[stepIndex]}
        </p>
        <ProductWizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      {editor.error ? (
        <Alert variant="destructive">
          <AlertDescription>{editor.error}</AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? (
        <ProductWizardStepBasics
          values={values}
          fieldErrors={fieldErrors}
          isSubmitting={isSubmitting}
          canSetStatus={canSetStatus}
          onChange={patchValues}
        />
      ) : null}

      {step === 2 ? (
        <ProductWizardStepTags
          values={values}
          isSubmitting={isSubmitting}
          disabled={!accessToken}
          onOpenPicker={openTagPicker}
        />
      ) : null}

      {step === 3 ? (
        <ProductWizardStepAttributes
          values={values}
          isSubmitting={isSubmitting}
          onOpenPicker={openAttributePicker}
          onRemove={removeAttribute}
        />
      ) : null}

      {step === 4 ? (
        <ProductWizardStepSummary values={values} showStatus={canSetStatus} />
      ) : null}
    </div>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }

  if (isHosted) {
    return null
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={handleFormOpenChange}
        title={title}
        description={STEP_DESCRIPTIONS[stepIndex]}
        sizeWidth={PRODUCT_WIZARD_DIALOG_SIZE.sizeWidth}
        sizeHeight={PRODUCT_WIZARD_DIALOG_SIZE.sizeHeight}
        nestedDismissGuard={nestedPickerOpen || blockOuterDismiss}
        footer={footer}
      >
        {body}
      </CustomDialog>
      <TagSelectStackedDialogs
        pickerOpen={tagPickerOpen}
        selectedTags={values.tags}
        onDone={(tags) => {
          patchValues({ tags })
          closeTagPicker()
        }}
        onClosePicker={closeTagPicker}
        pickerStackLevel={1}
      />
      <AttributeSelectStackedDialogs
        pickerOpen={attributePickerOpen}
        alreadySelectedAttributes={selectedAttributeValues}
        onDone={(attributes) => {
          applyAttributeSelection(attributes)
          closeAttributePicker()
        }}
        onClosePicker={closeAttributePicker}
        pickerStackLevel={1}
      />
    </>
  )
}
