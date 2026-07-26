import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
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
import {
  CatalogWizardStepSource,
  type CatalogAddSource,
} from '@/features/company-catalog/components/CatalogWizardStepSource'
import {
  buildLibraryPick,
  LibraryPickerPanel,
} from '@/features/company-catalog/components/LibraryPickerPanel'
import { ServiceWizardProgress } from '@/features/company-catalog/components/service-wizard/ServiceWizardProgress'
import { ServiceWizardStepAttributes } from '@/features/company-catalog/components/service-wizard/ServiceWizardStepAttributes'
import { ServiceWizardStepBasics } from '@/features/company-catalog/components/service-wizard/ServiceWizardStepBasics'
import { ServiceWizardStepSummary } from '@/features/company-catalog/components/service-wizard/ServiceWizardStepSummary'
import { ServiceWizardStepTags } from '@/features/company-catalog/components/service-wizard/ServiceWizardStepTags'
import { ServiceWizardStepTime } from '@/features/company-catalog/components/service-wizard/ServiceWizardStepTime'
import {
  buildServiceTimePayload,
  EMPTY_SERVICE_WIZARD_VALUES,
  serviceWizardStep1Schema,
  serviceWizardStep2Schema,
  serviceWizardStep3Schema,
  serviceWizardStep4Schema,
  toCompanyServicePayload,
  valuesFromServicePayload,
  type ServiceWizardFormValues,
  type ServiceWizardStep,
} from '@/features/company-catalog/schemas/serviceSchemas'
import { dataLibraryApi, type LibraryListItem } from '@/features/company-catalog/services/dataLibraryApi'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import type {
  CompanyCatalogItem,
  HydratedCatalogItem,
} from '@/features/company-catalog/types/companyCatalog.types'

const TOTAL_CREATE_STEPS = 5

const SERVICE_WIZARD_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
}

const STEP_TITLES = ['Basics', 'Time', 'Tags', 'Attributes', 'Summary'] as const
const STEP_DESCRIPTIONS = [
  'Name and describe this service.',
  'Choose how this service is scheduled.',
  'Optionally label this service with tags.',
  'Optionally add custom attribute values.',
  'Review your details before saving.',
] as const

type AttributeOption = { id: string; name: string; valueType: string }
type AddPhase = 'source' | 'library' | 'create'

export interface ServiceFormDialogProps {
  open: boolean
  id?: string
  initialStep?: ServiceWizardStep
  includeSourceStep?: boolean
  excludeLibraryIds?: string[]
  onOpenChange: (open: boolean) => void
  onSaved: (item?: CompanyCatalogItem | HydratedCatalogItem) => void
  chrome?: 'dialog' | 'embed-page'
}

export function ServiceFormDialog({
  open,
  id,
  initialStep = 1,
  includeSourceStep = false,
  excludeLibraryIds = [],
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: ServiceFormDialogProps) {
  const isNew = !id
  const showSource = isNew && includeSourceStep
  const finalSubmitLabel = isNew ? 'Create service' : 'Save changes'

  const [phase, setPhase] = useState<AddPhase>(showSource ? 'source' : 'create')
  const [source, setSource] = useState<CatalogAddSource | null>(null)
  const [step, setStep] = useState<ServiceWizardStep>(initialStep)
  const [values, setValues] = useState<ServiceWizardFormValues>(EMPTY_SERVICE_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ServiceWizardFormValues, string>>
  >({})
  const [nestedOpen, setNestedOpen] = useState(false)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([])
  const [seedLoading, setSeedLoading] = useState(false)
  const [librarySelected, setLibrarySelected] = useState<LibraryListItem | null>(null)
  const [libraryCreateOpen, setLibraryCreateOpen] = useState(false)
  const submittedRef = useRef(false)
  const librarySubmittedRef = useRef(false)
  const seededDetailIdRef = useRef<string | null>(null)
  const blockTimerRef = useRef<number | null>(null)

  const dispatch = useAppDispatch()
  const detail = useAppSelector((s) => s.companyCatalog.detail)
  const detailStatus = useAppSelector((s) => s.companyCatalog.detailStatus)
  const mutateStatus = useAppSelector((s) => s.companyCatalog.mutateStatus)
  const mutateError = useAppSelector((s) => s.companyCatalog.mutateError)

  const canSetStatus = false
  const isSubmitting = mutateStatus === 'saving'
  const detailForForm = !isNew && detail && detail.id === id ? detail : null
  const showLoading = Boolean(
    !isNew && (seedLoading || (detailStatus === 'loading' && !detailForForm)),
  )

  const title =
    phase === 'library'
      ? 'Add services from library'
      : phase === 'source'
        ? 'Add service'
        : isNew
          ? 'Create service'
          : 'Edit service'

  const description =
    phase === 'library'
      ? 'Select a library item, or add a new one to the library first.'
      : phase === 'source'
        ? 'Choose how to add this service.'
        : STEP_DESCRIPTIONS[step - 1]

  useEffect(() => {
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    let cancelled = false
    ;(async () => {
      try {
        const result = await dataLibraryApi.list('attributes', { pageSize: 100 })
        if (cancelled) return
        setAttributeOptions(
          result.items.map((item) => ({
            id: item.id,
            name: item.name,
            valueType: typeof item.valueType === 'string' ? item.valueType : 'text',
          })),
        )
      } catch {
        if (!cancelled) setAttributeOptions([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chrome, open])

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    const nextShowSource = !id && includeSourceStep
    setPhase(nextShowSource ? 'source' : 'create')
    setSource(null)
    setStep(initialStep)
    setFieldErrors({})
    setLibrarySelected(null)
    setLibraryCreateOpen(false)
    seededDetailIdRef.current = null
    submittedRef.current = false
    librarySubmittedRef.current = false
    dispatch(companyCatalogActions.clearMutateError())
    if (!id) {
      setValues(EMPTY_SERVICE_WIZARD_VALUES)
      setSeedLoading(false)
    }
  }, [chrome, dispatch, id, includeSourceStep, initialStep, open])

  useEffect(() => {
    if (!open || isNew || !id) return
    if (detail?.id === id) return
    dispatch(companyCatalogActions.detailRequested({ kind: 'services', id }))
  }, [open, isNew, id, detail?.id, dispatch])

  useEffect(() => {
    if (!open || isNew || !detailForForm) return
    if (seededDetailIdRef.current === detailForForm.id) return

    const payload = detailForForm.payload ?? detailForForm.hydrated ?? null
    const tagIds = Array.isArray(payload?.tagIds)
      ? (payload.tagIds as unknown[]).filter((v): v is string => typeof v === 'string')
      : []

    let cancelled = false
    setSeedLoading(true)
    ;(async () => {
      let tags: SelectTagValue[] = []
      if (tagIds.length > 0) {
        try {
          const result = await dataLibraryApi.list('tags', { ids: tagIds, pageSize: tagIds.length })
          tags = result.items.map((item) => ({
            id: item.id,
            name: item.name,
            color: typeof item.color === 'string' ? item.color : '#2563EB',
          }))
        } catch {
          tags = tagIds.map((tagId) => ({ id: tagId, name: tagId, color: '#2563EB' }))
        }
      }
      if (cancelled) return
      seededDetailIdRef.current = detailForForm.id
      setValues(valuesFromServicePayload(payload, tags))
      setSeedLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [detailForForm, isNew, open])

  useEffect(() => {
    if (!submittedRef.current && !librarySubmittedRef.current) return
    if (isSubmitting) return

    if (mutateError) {
      submittedRef.current = false
      librarySubmittedRef.current = false
      return
    }

    if (mutateStatus === 'idle') {
      submittedRef.current = false
      librarySubmittedRef.current = false
      onSaved(detailForForm ?? undefined)
      onOpenChange(false)
    }
  }, [detailForForm, isSubmitting, mutateError, mutateStatus, onOpenChange, onSaved])

  function patchValues(patch: Partial<ServiceWizardFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  const handleNestedOpenChange = useCallback((openNested: boolean) => {
    setNestedOpen(openNested)
    if (!openNested) {
      setBlockOuterDismiss(true)
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
      blockTimerRef.current = window.setTimeout(() => {
        setBlockOuterDismiss(false)
        blockTimerRef.current = null
      }, 150)
    }
  }, [])

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

  function handleSourceNext() {
    if (!source) return
    if (source === 'library') {
      setPhase('library')
      return
    }
    setPhase('create')
    setStep(1)
  }

  function handleNext() {
    if (!validateStep(step)) return
    if (step < TOTAL_CREATE_STEPS) {
      setStep((step + 1) as ServiceWizardStep)
    }
  }

  function handlePrevious() {
    setFieldErrors({})
    if (phase === 'library') {
      setPhase('source')
      setLibrarySelected(null)
      return
    }
    if (phase === 'create' && showSource && step === 1) {
      setPhase('source')
      return
    }
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
    dispatch(companyCatalogActions.clearMutateError())
    submittedRef.current = true
    const payload = toCompanyServicePayload(values, {
      canSetStatus,
      attributes: attributeOptions,
    })

    if (isNew) {
      dispatch(companyCatalogActions.createCustomRequested({ kind: 'services', payload }))
      return
    }
    if (!id) return
    dispatch(companyCatalogActions.updateRequested({ kind: 'services', id, payload }))
  }

  function handleLibraryPick(mode: 'linked' | 'forked') {
    if (!librarySelected) return
    dispatch(companyCatalogActions.clearMutateError())
    librarySubmittedRef.current = true
    dispatch(
      companyCatalogActions.fromLibraryRequested({
        kind: 'services',
        ...buildLibraryPick('services', librarySelected, mode),
      }),
    )
  }

  function handleFormOpenChange(next: boolean) {
    if (next) return
    if (nestedOpen || blockOuterDismiss || libraryCreateOpen) return
    onOpenChange(false)
  }

  const showCreatePrevious = phase === 'create' && (step > 1 || showSource)

  const footer =
    phase === 'library' ? (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={() => handleFormOpenChange(false)}
          disabled={isSubmitting || libraryCreateOpen}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={handlePrevious}
          disabled={isSubmitting || libraryCreateOpen}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          disabled={!librarySelected || isSubmitting || libraryCreateOpen}
          onClick={() => handleLibraryPick('forked')}
        >
          Customize
        </Button>
        <Button
          type="button"
          className="h-10 px-4"
          disabled={!librarySelected || isSubmitting || libraryCreateOpen}
          onClick={() => handleLibraryPick('linked')}
        >
          Link live
        </Button>
      </div>
    ) : phase === 'source' ? (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={() => handleFormOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="h-10 px-4"
          onClick={handleSourceNext}
          disabled={!source}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ) : (
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
        {showCreatePrevious ? (
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
        {step < TOTAL_CREATE_STEPS ? (
          <Button
            type="button"
            className="h-10 px-4"
            onClick={handleNext}
            disabled={isSubmitting || showLoading || nestedOpen}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            className="h-10"
            onClick={handleSubmit}
            disabled={isSubmitting || showLoading || nestedOpen}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving…' : finalSubmitLabel}
          </Button>
        )}
      </div>
    )

  const createBody = showLoading ? (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner size="lg" />
    </div>
  ) : (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {step} of {TOTAL_CREATE_STEPS} — {STEP_TITLES[step - 1]}
        </p>
        <ServiceWizardProgress currentStep={step} totalSteps={TOTAL_CREATE_STEPS} />
      </div>

      {mutateError ? (
        <Alert variant="destructive">
          <AlertDescription>{mutateError}</AlertDescription>
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
          onChange={patchValues}
          onNestedOpenChange={handleNestedOpenChange}
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

  const body =
    phase === 'source' ? (
      <div className="space-y-6">
        <CatalogWizardStepSource value={source} onChange={setSource} entityLabel="service" />
      </div>
    ) : phase === 'library' ? (
      <LibraryPickerPanel
        active={open && phase === 'library'}
        kind="services"
        excludeLibraryIds={excludeLibraryIds}
        busy={isSubmitting}
        error={mutateError}
        onCreateOpenChange={setLibraryCreateOpen}
        onSelectedChange={setLibrarySelected}
      />
    ) : (
      createBody
    )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleFormOpenChange}
      title={title}
      description={description}
      sizeWidth={SERVICE_WIZARD_DIALOG_SIZE.sizeWidth}
      sizeHeight={SERVICE_WIZARD_DIALOG_SIZE.sizeHeight}
      nestedDismissGuard={nestedOpen || blockOuterDismiss || libraryCreateOpen}
      footer={footer}
    >
      {body}
    </CustomDialog>
  )
}
