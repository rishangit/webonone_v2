import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  mapZodIssuesToFieldErrors,
  ServiceSelectionDialog,
  type LoadServicesFn,
  type ServiceOption,
} from '@webonone/ui-kit'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import {
  EMPTY_WORKFLOW_WIZARD_VALUES,
  WORKFLOW_STEP_TITLES_DURATION,
  WORKFLOW_STEP_TITLES_WINDOW,
  parseWorkflowWizardStep,
  workflowWizardStepSpaceOptionalSchema,
  workflowWizardStepSpaceSchema,
  workflowWizardTotalSteps,
  type WorkflowWizardStep,
  type WorkflowWizardValues,
} from '@/features/company-catalog/schemas/workflowSchemas'
import { WorkflowWizardProgress } from '@/features/company-catalog/components/workflow-wizard/WorkflowWizardProgress'
import { WorkflowWizardStepForms } from '@/features/company-catalog/components/workflow-wizard/WorkflowWizardStepForms'
import { WorkflowWizardStepQueue } from '@/features/company-catalog/components/workflow-wizard/WorkflowWizardStepQueue'
import { WorkflowWizardStepSpace } from '@/features/company-catalog/components/workflow-wizard/WorkflowWizardStepSpace'
import { WorkflowWizardStepStaff } from '@/features/company-catalog/components/workflow-wizard/WorkflowWizardStepStaff'
import { WorkflowWizardStepSummary } from '@/features/company-catalog/components/workflow-wizard/WorkflowWizardStepSummary'
import { FormSelectionDialog } from '@/features/design/components/FormSelectionDialog'
import { StaffSelectionDialog } from '@/features/staff/components/StaffSelectionDialog'
import {
  createCompanyCatalogSpacesLoader,
  mapHydratedCatalogToEventSpace,
} from '@/features/calendar/services/serviceSelectionLoaders'
import type { EventSpaceOption } from '@/features/calendar/schemas/eventSchemas'
import { hydrateLinkedCatalogItems } from '@/features/company-catalog/utils/hydrateLinkedCatalog'
import type { ServiceWorkflowItem } from '@/features/company-catalog/types/companyCatalog.types'

const DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
}

const OUTLINE_FOOTER =
  'h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent'

const STEP_KEYS_DURATION = ['space', 'staff', 'forms', 'summary'] as const
const STEP_KEYS_WINDOW = ['space', 'staff', 'forms', 'queue', 'summary'] as const

type WorkflowItemFormDialogProps = {
  open: boolean
  companyId?: string
  timeMode?: 'duration' | 'window'
  usedSpaceIds: string[]
  initial: ServiceWorkflowItem | null
  orderNumber: number
  saving?: boolean
  onClose: () => void
  onSave: (item: ServiceWorkflowItem) => void
}

function valuesFromItem(item: ServiceWorkflowItem | null): WorkflowWizardValues {
  if (!item) return { ...EMPTY_WORKFLOW_WIZARD_VALUES }
  return {
    space: item.space,
    staff: item.staff,
    forms: item.forms.map((form) => ({
      id: form.id,
      name: form.name ?? form.id,
    })),
    sessionQueue: Boolean(
      item.sessionQueue ?? (item as { session_queue?: boolean }).session_queue,
    ),
    addItemsEnabled: Boolean(
      item.addItemsEnabled ?? (item as { add_items_enabled?: boolean }).add_items_enabled,
    ),
    addItemsFromLibraryEnabled: Boolean(
      item.addItemsFromLibraryEnabled ??
        (item as { add_items_from_library_enabled?: boolean }).add_items_from_library_enabled,
    ),
  }
}

export function WorkflowItemFormDialog({
  open,
  companyId,
  timeMode,
  usedSpaceIds,
  initial,
  orderNumber,
  saving = false,
  onClose,
  onSave,
}: WorkflowItemFormDialogProps) {
  const showQueue = timeMode === 'window'
  const totalSteps = workflowWizardTotalSteps(timeMode)
  const stepTitles = showQueue ? WORKFLOW_STEP_TITLES_WINDOW : WORKFLOW_STEP_TITLES_DURATION
  const stepKeys = showQueue ? STEP_KEYS_WINDOW : STEP_KEYS_DURATION
  const [step, setStep] = useState<WorkflowWizardStep>(1)
  const [values, setValues] = useState<WorkflowWizardValues>(EMPTY_WORKFLOW_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [spacePickerOpen, setSpacePickerOpen] = useState(false)
  const [staffPickerOpen, setStaffPickerOpen] = useState(false)
  const [formPickerOpen, setFormPickerOpen] = useState(false)
  const spaceCacheRef = useRef(new Map<string, EventSpaceOption>())
  const excluded = useMemo(() => new Set(usedSpaceIds), [usedSpaceIds])
  const spaceOptional = initial?.kind === 'check_in'

  useEffect(() => {
    if (!open) return
    setStep(1)
    setValues(valuesFromItem(initial))
    setFieldErrors({})
    setSpacePickerOpen(false)
    setStaffPickerOpen(false)
    setFormPickerOpen(false)
  }, [initial, open])

  const loadSpaces: LoadServicesFn = useCallback(
    async (params) => {
      if (companyId) {
        const result = await companyCatalogApi.listForCompany(companyId, 'spaces')
        const hydrated = await hydrateLinkedCatalogItems('spaces', result.items)
        let mapped = hydrated
          .map(mapHydratedCatalogToEventSpace)
          .filter((space): space is EventSpaceOption => space != null)
          .filter((space) => !excluded.has(space.id) || space.id === values.space?.id)
        const q = params.search.trim().toLowerCase()
        if (q) {
          mapped = mapped.filter((space) => space.name.toLowerCase().includes(q))
        }
        for (const space of mapped) {
          spaceCacheRef.current.set(space.id, space)
        }
        const start = (params.page - 1) * params.pageSize
        const slice = mapped.slice(start, start + params.pageSize)
        return {
          services: slice.map((space) => ({
            id: space.id,
            name: space.name,
            description: space.description?.trim() ? space.description : null,
            imageUrl: space.imageUrl ?? null,
          })),
          hasMore: start + params.pageSize < mapped.length,
        }
      }

      const inner = createCompanyCatalogSpacesLoader(spaceCacheRef.current)
      const result = await inner({ ...params, page: 1, pageSize: 500 })
      const filtered = result.services.filter(
        (space) => !excluded.has(space.id) || space.id === values.space?.id,
      )
      const q = params.search.trim().toLowerCase()
      const searched = q
        ? filtered.filter((space) => space.name.toLowerCase().includes(q))
        : filtered
      const start = (params.page - 1) * params.pageSize
      const slice = searched.slice(start, start + params.pageSize)
      return {
        services: slice,
        hasMore: start + params.pageSize < searched.length,
      }
    },
    [companyId, excluded, values.space?.id],
  )

  function patchValues(patch: Partial<WorkflowWizardValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function handleSpaceSelect(option: ServiceOption) {
    const cached = spaceCacheRef.current.get(option.id)
    patchValues({
      space: {
        id: option.id,
        name: option.name,
        description: cached?.description ?? option.description ?? null,
      },
    })
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.space
      return next
    })
    setSpacePickerOpen(false)
  }

  function validateCurrentStep(): boolean {
    if (stepKeys[step - 1] !== 'space') return true
    const schema = spaceOptional
      ? workflowWizardStepSpaceOptionalSchema
      : workflowWizardStepSpaceSchema
    const result = schema.safeParse({ space: values.space })
    if (result.success) {
      setFieldErrors({})
      return true
    }
    setFieldErrors(
      mapZodIssuesToFieldErrors(
        result.error.issues.map((issue) => ({
          path: issue.path as Array<string | number>,
          message: issue.message,
        })),
      ) as Record<string, string>,
    )
    return false
  }

  function handlePrimary() {
    if (saving) return
    if (step < totalSteps) {
      if (!validateCurrentStep()) return
      setStep((prev) => parseWorkflowWizardStep(prev + 1, totalSteps))
      return
    }
    if (!spaceOptional && !values.space) return
    onSave({
      id: initial?.id ?? `new-${values.space?.id ?? 'space'}`,
      kind: initial?.kind ?? 'space',
      orderNumber,
      space: values.space
        ? { id: values.space.id, name: values.space.name }
        : null,
      staff: values.staff,
      forms: values.forms,
      sessionQueue: showQueue ? values.sessionQueue : false,
      addItemsEnabled: values.addItemsEnabled,
      addItemsFromLibraryEnabled: values.addItemsEnabled
        ? values.addItemsFromLibraryEnabled
        : false,
    })
  }

  const isLastStep = step >= totalSteps
  const pickerOpen = spacePickerOpen || staffPickerOpen || formPickerOpen
  const stepKey = stepKeys[step - 1]

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={(next) => {
          if (saving) return
          if (!next) onClose()
        }}
        title={initial ? 'Edit workflow item' : 'Add workflow item'}
        description={stepTitles[step - 1]}
        {...DIALOG_SIZE}
        nestedDismissGuard={pickerOpen}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className={OUTLINE_FOOTER}
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className={OUTLINE_FOOTER}
                disabled={saving}
                onClick={() => setStep((prev) => parseWorkflowWizardStep(prev - 1, totalSteps))}
              >
                <ChevronLeft className="mr-2 h-4 w-4" aria-hidden />
                Previous
              </Button>
            ) : null}
            <Button type="button" className="h-10 px-4" disabled={saving} onClick={handlePrimary}>
              {isLastStep ? <Save className="mr-2 h-4 w-4" aria-hidden /> : null}
              {isLastStep ? (saving ? 'Saving…' : 'Save') : 'Next'}
              {!isLastStep ? <ChevronRight className="ml-2 h-4 w-4" aria-hidden /> : null}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step {step} of {totalSteps} — {stepTitles[step - 1]}
            </p>
            <WorkflowWizardProgress currentStep={step} totalSteps={totalSteps} />
          </div>
          {fieldErrors.space && stepKey !== 'space' ? (
            <Alert variant="destructive">
              <AlertDescription>{fieldErrors.space}</AlertDescription>
            </Alert>
          ) : null}
          {stepKey === 'space' ? (
            <WorkflowWizardStepSpace
              space={values.space}
              spaceRequired={!spaceOptional}
              onOpenPicker={() => setSpacePickerOpen(true)}
              onClear={
                spaceOptional
                  ? () => patchValues({ space: null })
                  : undefined
              }
              error={fieldErrors.space}
            />
          ) : null}
          {stepKey === 'staff' ? (
            <WorkflowWizardStepStaff
              staff={values.staff}
              onOpenPicker={() => setStaffPickerOpen(true)}
            />
          ) : null}
          {stepKey === 'forms' ? (
            <WorkflowWizardStepForms
              forms={values.forms}
              onOpenPicker={() => setFormPickerOpen(true)}
              showAddItemsToggle={!showQueue}
              addItemsEnabled={values.addItemsEnabled}
              onAddItemsEnabledChange={(addItemsEnabled) => patchValues({ addItemsEnabled })}
              addItemsFromLibraryEnabled={values.addItemsFromLibraryEnabled}
              onAddItemsFromLibraryEnabledChange={(addItemsFromLibraryEnabled) =>
                patchValues({ addItemsFromLibraryEnabled })
              }
            />
          ) : null}
          {stepKey === 'queue' ? (
            <WorkflowWizardStepQueue
              sessionQueue={values.sessionQueue}
              onChange={(sessionQueue) => patchValues({ sessionQueue })}
              addItemsEnabled={values.addItemsEnabled}
              onAddItemsEnabledChange={(addItemsEnabled) => patchValues({ addItemsEnabled })}
              addItemsFromLibraryEnabled={values.addItemsFromLibraryEnabled}
              onAddItemsFromLibraryEnabledChange={(addItemsFromLibraryEnabled) =>
                patchValues({ addItemsFromLibraryEnabled })
              }
            />
          ) : null}
          {stepKey === 'summary' ? (
            <WorkflowWizardStepSummary
              values={values}
              orderNumber={orderNumber}
              showQueue={showQueue}
            />
          ) : null}
        </div>
      </CustomDialog>

      <ServiceSelectionDialog
        open={spacePickerOpen}
        onOpenChange={setSpacePickerOpen}
        title="Select space"
        description="Choose the company space for this workflow step."
        searchPlaceholder="Search spaces…"
        loadServices={loadSpaces}
        emptyMessage="No company spaces available."
        chrome="dialog"
        nestedDismissGuard
        onSelect={handleSpaceSelect}
      />

      <StaffSelectionDialog
        open={staffPickerOpen}
        onOpenChange={setStaffPickerOpen}
        initialSelected={values.staff}
        nestedDismissGuard
        onSelect={(staff) => {
          patchValues({ staff })
          setStaffPickerOpen(false)
        }}
      />

      <FormSelectionDialog
        open={formPickerOpen}
        onOpenChange={setFormPickerOpen}
        initialSelected={values.forms}
        nestedDismissGuard
        onSelect={(forms) => {
          patchValues({ forms })
          setFormPickerOpen(false)
        }}
      />
    </>
  )
}
