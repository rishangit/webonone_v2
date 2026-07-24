import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { attributesActions } from '@/features/attributes/store'
import { servicesActions } from '@/features/services/store'
import {
  buildServiceTimePayload,
  EMPTY_SERVICE_WIZARD_VALUES,
  parseServiceWizardStep,
  serviceWizardStep1Schema,
  serviceWizardStep2Schema,
  serviceWizardStep3Schema,
  serviceWizardStep4Schema,
  toCreateServicePayload,
  type ServiceWizardFormValues,
  type ServiceWizardStep,
} from '@/features/services/schemas/serviceSchemas'
import { ServiceWizardProgress } from '@/features/services/components/service-wizard/ServiceWizardProgress'
import { ServiceWizardStepBasics } from '@/features/services/components/service-wizard/ServiceWizardStepBasics'
import { ServiceWizardStepTime } from '@/features/services/components/service-wizard/ServiceWizardStepTime'
import { ServiceWizardStepTags } from '@/features/services/components/service-wizard/ServiceWizardStepTags'
import { ServiceWizardStepAttributes } from '@/features/services/components/service-wizard/ServiceWizardStepAttributes'
import { ServiceWizardStepSummary } from '@/features/services/components/service-wizard/ServiceWizardStepSummary'
import {
  createNestedRequestId,
  TAG_SELECT_EMBED_PATH,
  TagSelectStackedDialogs,
  writeTagSelectSession,
} from '@/features/tags/components/TagSelectField'
import { useEpicCatalogEditor } from '@/shared/hooks/useEpicCatalogEditor'
import type { CatalogItem } from '@/shared/types/data.types'

const TOTAL_STEPS = 5

const SERVICE_WIZARD_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
}

const TAG_PICKER_PEER_SIZE = {
  sizeWidth: 'small' as const,
  sizeHeight: 'large' as const,
}

const STEP_TITLES = ['Basics', 'Time', 'Tags', 'Attributes', 'Summary'] as const
const STEP_DESCRIPTIONS = [
  'Name and describe this service.',
  'Choose how this service is scheduled.',
  'Optionally label this service with tags.',
  'Optionally add custom attribute values.',
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

function valuesFromCatalogItem(item: CatalogItem): ServiceWizardFormValues {
  return {
    name: item.name,
    description: item.description ?? '',
    status: item.status,
    time_mode: item.timeMode ?? 'duration',
    duration_minutes:
      item.durationMinutes != null ? String(item.durationMinutes) : '60',
    start_time: item.startTime ?? '',
    end_time: item.endTime ?? '',
    tags: item.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    attributes: item.attributes.map((a) => ({
      attributeId: a.attributeId,
      valueText: a.valueText ?? '',
      valueNumber: a.valueNumber != null ? String(a.valueNumber) : '',
    })),
  }
}

export interface ServiceFormDialogProps {
  open: boolean
  id?: string
  initialStep?: ServiceWizardStep
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  chrome?: 'dialog' | 'embed-page'
}

export function ServiceFormDialog({
  open,
  id,
  initialStep = 1,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: ServiceFormDialogProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const isNew = !id
  const title = isNew ? 'Create service' : 'Edit service'
  const embedStep =
    chrome === 'embed-page'
      ? parseServiceWizardStep(searchParams.get('step'))
      : initialStep
  const stepQuery = embedStep > 1 ? `?step=${embedStep}` : ''
  const path = isNew
    ? `/embed/dialogs/services/create${stepQuery}`
    : `/embed/dialogs/services/${id}/edit${stepQuery}`
  const finalSubmitLabel = isNew ? 'Create service' : 'Save changes'
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const [step, setStep] = useState<ServiceWizardStep>(embedStep)
  const [values, setValues] = useState<ServiceWizardFormValues>(EMPTY_SERVICE_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ServiceWizardFormValues, string>>
  >({})
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const submittedRef = useRef(false)
  const seededDetailIdRef = useRef<string | null>(null)
  const tagPickerOpenRef = useRef(false)
  const blockOuterDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)
  const nestedTagRequestIdRef = useRef<string | null>(null)

  const dispatch = useAppDispatch()
  const userRole = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const canSetStatus = userRole === 'super_admin'
  const attributeOptions = useAppSelector((s) => s.attributes.items)

  const editor = useEpicCatalogEditor(id, isNew, (s) => s.services, servicesActions)
  const cachedDetail = useAppSelector((s) => s.services.detail)
  const detailForForm =
    !isNew && editor.detail && (editor.detail as CatalogItem).id === id
      ? (editor.detail as CatalogItem)
      : !isNew && cachedDetail?.id === id
        ? cachedDetail
        : null
  const showLoading = Boolean(!isNew && editor.loading && !detailForForm)

  const primaryLabelForStep = (current: ServiceWizardStep, saving: boolean) => {
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
    ...SERVICE_WIZARD_DIALOG_SIZE,
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
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    dispatch(attributesActions.loadListRequested({ pageSize: 100, force: true }))
  }, [dispatch])

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    const nextStep = chrome === 'embed-page' ? embedStep : initialStep
    setStep(nextStep)
    setFieldErrors({})
    seededDetailIdRef.current = null
    if (isNew) {
      setValues(EMPTY_SERVICE_WIZARD_VALUES)
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
      setBlockOuterDismiss(false)
      blockOuterDismissRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (!submittedRef.current || editor.saving) return
    submittedRef.current = false
    if (!editor.error) onSaved()
  }, [editor.saving, editor.error, onSaved])

  const closeTagPicker = useCallback(() => {
    setTagPickerOpen(false)
    tagPickerOpenRef.current = false
    nestedTagRequestIdRef.current = null
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

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin || event.source !== window.parent) {
        return
      }
      const nestedId = nestedTagRequestIdRef.current
      if (!nestedId) {
        return
      }

      if (
        isPlatformPeerDialogNestedResultMessage(event.data) &&
        event.data.parentRequestId === dialogRequestId &&
        event.data.requestId === nestedId
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
        event.data.requestId === nestedId
      ) {
        closeTagPicker()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [chrome, closeTagPicker, dialogRequestId, parentOrigin])

  function patchValues(patch: Partial<ServiceWizardFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function validateStep(current: ServiceWizardStep): boolean {
    if (current === 1) {
      const result = serviceWizardStep1Schema.safeParse({
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
      const result = serviceWizardStep2Schema.safeParse(buildServiceTimePayload(values))
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 3) {
      const result = serviceWizardStep3Schema.safeParse({
        tag_ids: values.tags.map((tag) => tag.id),
      })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 4) {
      const result = serviceWizardStep4Schema.safeParse({
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
      setStep((step + 1) as ServiceWizardStep)
    }
  }

  function handlePrevious() {
    setFieldErrors({})
    if (step > 1) {
      setStep((step - 1) as ServiceWizardStep)
    }
  }

  function handleSubmit() {
    const step1 = serviceWizardStep1Schema.safeParse({
      name: values.name,
      description: values.description,
      status: values.status,
    })
    if (!step1.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(step1.error.issues))
      setStep(1)
      return
    }

    const step2 = serviceWizardStep2Schema.safeParse(buildServiceTimePayload(values))
    if (!step2.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(step2.error.issues))
      setStep(2)
      return
    }

    setFieldErrors({})
    submittedRef.current = true
    editor.save(
      toCreateServicePayload(values, {
        canSetStatus,
        attributes: attributeOptions,
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

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      if (tagPickerOpenRef.current) {
        return
      }
      handlePrimaryAction()
    },
    onSecondary: () => {
      if (tagPickerOpenRef.current || editor.saving) {
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
      editor.saving || tagPickerOpen,
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
    parentOrigin,
    step,
    tagPickerOpen,
    finalSubmitLabel,
  ])

  function handleFormOpenChange(next: boolean) {
    if (next) return
    if (tagPickerOpenRef.current || tagPickerOpen) {
      closeTagPicker()
      return
    }
    if (blockOuterDismissRef.current || blockOuterDismiss) {
      return
    }
    onOpenChange(false)
  }

  const stepIndex = step - 1
  const isSubmitting = editor.saving

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
          disabled={isSubmitting || showLoading || tagPickerOpen}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          className="h-10"
          onClick={handleSubmit}
          disabled={isSubmitting || showLoading || tagPickerOpen}
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
        <ServiceWizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      {editor.error ? (
        <Alert variant="destructive">
          <AlertDescription>{editor.error}</AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? (
        <ServiceWizardStepBasics
          values={values}
          fieldErrors={fieldErrors}
          isSubmitting={isSubmitting}
          canSetStatus={canSetStatus}
          onChange={patchValues}
        />
      ) : null}

      {step === 2 ? (
        <ServiceWizardStepTime
          values={values}
          fieldErrors={fieldErrors}
          isSubmitting={isSubmitting}
          onChange={patchValues}
        />
      ) : null}

      {step === 3 ? (
        <ServiceWizardStepTags
          values={values}
          isSubmitting={isSubmitting}
          disabled={!accessToken}
          onOpenPicker={openTagPicker}
        />
      ) : null}

      {step === 4 ? (
        <ServiceWizardStepAttributes
          values={values}
          attributeOptions={attributeOptions}
          isSubmitting={isSubmitting}
          onChange={patchValues}
        />
      ) : null}

      {step === 5 ? (
        <ServiceWizardStepSummary
          values={values}
          attributeOptions={attributeOptions}
          showStatus={canSetStatus}
        />
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
        sizeWidth={SERVICE_WIZARD_DIALOG_SIZE.sizeWidth}
        sizeHeight={SERVICE_WIZARD_DIALOG_SIZE.sizeHeight}
        nestedDismissGuard={tagPickerOpen || blockOuterDismiss}
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
    </>
  )
}
