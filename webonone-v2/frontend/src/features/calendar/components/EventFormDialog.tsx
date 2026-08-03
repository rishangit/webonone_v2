import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  mapZodIssuesToFieldErrors,
  ServiceSelectionDialog,
  Spinner,
  useToast,
  UserSelectionDialog,
  type ServiceOption,
  type UserOption,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { EventWizardProgress } from '@/features/calendar/components/event-wizard/EventWizardProgress'
import { EventWizardStepAttendee } from '@/features/calendar/components/event-wizard/EventWizardStepAttendee'
import { EventWizardStepService } from '@/features/calendar/components/event-wizard/EventWizardStepService'
import { EventWizardStepStaff } from '@/features/calendar/components/event-wizard/EventWizardStepStaff'
import { EventWizardStepSummary } from '@/features/calendar/components/event-wizard/EventWizardStepSummary'
import { EventWizardStepWhen } from '@/features/calendar/components/event-wizard/EventWizardStepWhen'
import { EventWizardStepWhere } from '@/features/calendar/components/event-wizard/EventWizardStepWhere'
import {
  EMPTY_EVENT_WIZARD_VALUES,
  eventWizardStepAttendeeSchema,
  eventWizardStepServiceSchema,
  eventWizardStepSpaceSchema,
  eventWizardStepStaffSchema,
  eventWizardStepWhenDurationSchema,
  eventWizardStepWhenWindowSchema,
  eventWizardTotalSteps,
  parseEventWizardStep,
  staffWorkingWeekdays,
  toCreateEventPayload,
  toUpdateEventPayload,
  valuesFromEvent,
  type EventServiceOption,
  type EventSpaceOption,
  type EventWizardFormValues,
  type EventWizardStep,
} from '@/features/calendar/schemas/eventSchemas'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import {
  createCompanyCatalogServicesLoader,
  createCompanyCatalogSpacesLoader,
} from '@/features/calendar/services/serviceSelectionLoaders'
import type { CompanyEvent } from '@/features/calendar/types/event.types'
import { loadIdentityUsersForStaff } from '@/features/staff/services/identityUsersApi'
import { staffApi } from '@/features/staff/services/staffApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

const DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
}

const OUTLINE_FOOTER =
  'h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent'

function flattenZodFieldErrors(
  issues: ReadonlyArray<{ path: readonly PropertyKey[]; message: string }>,
): Record<string, string> {
  const normalized = issues.map((issue) => ({
    path: issue.path.filter((p): p is string | number => typeof p === 'string' || typeof p === 'number'),
    message: issue.message,
  }))
  return mapZodIssuesToFieldErrors(normalized) as Record<string, string>
}

export interface EventFormDialogProps {
  open: boolean
  /** Omit for create; set for edit. */
  id?: string
  /** 1-based wizard step (default 1). */
  initialStep?: EventWizardStep | number
  onOpenChange: (open: boolean) => void
  onSaved: (item: CompanyEvent) => void
}

export function EventFormDialog({
  open,
  id,
  initialStep = 1,
  onOpenChange,
  onSaved,
}: EventFormDialogProps) {
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const isNew = !id
  const [step, setStep] = useState<EventWizardStep>(parseEventWizardStep(initialStep))
  const [values, setValues] = useState<EventWizardFormValues>(EMPTY_EVENT_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staffList, setStaffList] = useState<CompanyStaff[]>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [servicePickerOpen, setServicePickerOpen] = useState(false)
  const [spacePickerOpen, setSpacePickerOpen] = useState(false)
  const [attendeePickerOpen, setAttendeePickerOpen] = useState(false)
  const serviceByIdRef = useRef(new Map<string, EventServiceOption>())
  const spaceByIdRef = useRef(new Map<string, EventSpaceOption>())
  const loadServices = useMemo(
    () => createCompanyCatalogServicesLoader(serviceByIdRef.current),
    [],
  )
  const loadSpaces = useMemo(
    () => createCompanyCatalogSpacesLoader(spaceByIdRef.current),
    [],
  )

  const isDuration = values.service?.timeMode === 'duration'
  const stepTitles = useMemo(() => {
    if (isDuration) return ['Service', 'Staff', 'Attendee', 'When', 'Summary'] as const
    return ['Service', 'Staff', 'Where', 'When', 'Summary'] as const
  }, [isDuration])

  const stepDescriptions = useMemo(() => {
    if (isDuration) {
      return [
        'Select the company service for this event.',
        'Choose which staff member will deliver the service.',
        'Select the Identity user attending this event.',
        'Pick the date and start time; optionally repeat weekly, biweekly, or monthly.',
        isNew ? 'Review and create the event.' : 'Review and save changes.',
      ] as const
    }
    return [
      'Select the company service for this event.',
      'Choose which staff member will deliver the service.',
      'Choose the space where this Specific time event happens.',
      'Select working weekdays and the From–Until range (service time is fixed).',
      isNew ? 'Review and create the event.' : 'Review and save changes.',
    ] as const
  }, [isDuration, isNew])

  const totalSteps = stepTitles.length

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    setError(null)
    setSaving(false)
    setStaffSearch('')
    setServicePickerOpen(false)
    setSpacePickerOpen(false)
    setAttendeePickerOpen(false)
    serviceByIdRef.current.clear()
    spaceByIdRef.current.clear()

    let cancelled = false
    setLoading(true)

    async function bootstrap() {
      try {
        const staffResult = await staffApi.list({ page: 1, pageSize: 500, force: true })
        if (cancelled) return
        setStaffList(staffResult.items)

        if (isNew) {
          setValues({ ...EMPTY_EVENT_WIZARD_VALUES })
          setStep(parseEventWizardStep(initialStep, 5))
          return
        }

        const event = await eventsApi.get(id!)
        if (cancelled) return

        let staff =
          staffResult.items.find((item) => item.id === event.staffId) ?? null
        if (!staff) {
          try {
            staff = await staffApi.get(event.staffId)
          } catch {
            staff = null
          }
        }
        if (cancelled) return

        const nextValues = valuesFromEvent(event, staff)
        if (nextValues.service) {
          serviceByIdRef.current.set(nextValues.service.id, nextValues.service)
        }
        if (nextValues.space) {
          spaceByIdRef.current.set(nextValues.space.id, nextValues.space)
        }
        setValues(nextValues)
        const max = eventWizardTotalSteps(event.timeMode)
        setStep(parseEventWizardStep(initialStep, max))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load wizard data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [open, id, isNew, initialStep])

  useEffect(() => {
    setStep((prev) => parseEventWizardStep(prev, totalSteps))
  }, [totalSteps])

  const loadUsers = useCallback(
    async (params: Parameters<typeof loadIdentityUsersForStaff>[1]) => {
      if (!accessToken) throw new Error('Not signed in')
      return loadIdentityUsersForStaff(accessToken, params, new Set())
    },
    [accessToken],
  )

  function patchValues(patch: Partial<EventWizardFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function currentStepKey(): 'service' | 'staff' | 'attendee' | 'where' | 'when' | 'summary' {
    const index = step - 1
    if (isDuration) {
      return (['service', 'staff', 'attendee', 'when', 'summary'] as const)[index]!
    }
    return (['service', 'staff', 'where', 'when', 'summary'] as const)[index]!
  }

  function validateCurrent(): boolean {
    const key = currentStepKey()
    if (key === 'service') {
      const result = eventWizardStepServiceSchema.safeParse({ service: values.service })
      if (!result.success) {
        setFieldErrors(flattenZodFieldErrors(result.error.issues))
        return false
      }
    } else if (key === 'staff') {
      const result = eventWizardStepStaffSchema.safeParse({ staff: values.staff })
      if (!result.success) {
        setFieldErrors(flattenZodFieldErrors(result.error.issues))
        return false
      }
    } else if (key === 'attendee') {
      const result = eventWizardStepAttendeeSchema.safeParse({ attendee: values.attendee })
      if (!result.success) {
        setFieldErrors(flattenZodFieldErrors(result.error.issues))
        return false
      }
    } else if (key === 'where') {
      const result = eventWizardStepSpaceSchema.safeParse({ space: values.space })
      if (!result.success) {
        setFieldErrors(flattenZodFieldErrors(result.error.issues))
        return false
      }
    } else if (key === 'when') {
      if (!values.staff) {
        setFieldErrors({ staff: 'Select a staff member first' })
        return false
      }
      const working = staffWorkingWeekdays(values.staff.schedule)
      const result =
        values.service?.timeMode === 'window'
          ? eventWizardStepWhenWindowSchema.safeParse({
              startsOn: values.startsOn,
              weekdays: values.weekdays,
              recurrenceUntil: values.recurrenceUntil,
              staffWorkingWeekdays: working,
            })
          : eventWizardStepWhenDurationSchema.safeParse({
              startsOn: values.startsOn,
              startTime: values.startTime,
              recurrence: values.recurrence,
              recurrenceUntil: values.recurrenceUntil,
              staffWorkingWeekdays: working,
            })
      if (!result.success) {
        setFieldErrors(flattenZodFieldErrors(result.error.issues))
        return false
      }
    }
    setFieldErrors({})
    return true
  }

  async function handlePrimary() {
    if (step < totalSteps) {
      if (!validateCurrent()) return
      setStep((prev) => parseEventWizardStep(prev + 1, totalSteps))
      return
    }

    setSaving(true)
    setError(null)
    try {
      const saved = isNew
        ? await eventsApi.create(toCreateEventPayload(values))
        : await eventsApi.update(id!, toUpdateEventPayload(values))
      toast({ title: isNew ? 'Event created' : 'Event saved' })
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isNew
            ? 'Failed to create event'
            : 'Failed to save event'
      setError(message)
      toast({
        title: isNew ? 'Failed to create event' : 'Failed to save event',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function handleServiceSelect(option: ServiceOption) {
    const service = serviceByIdRef.current.get(option.id)
    if (!service) return
    setValues((prev) => ({
      ...prev,
      service,
      attendee: service.timeMode === 'window' ? null : prev.attendee,
      space: service.timeMode === 'duration' ? null : prev.space,
      startTime: prev.startTime,
      weekdays: service.timeMode === 'duration' ? [] : prev.weekdays,
      recurrence:
        service.timeMode === 'duration'
          ? prev.service?.timeMode === 'duration'
            ? prev.recurrence
            : 'none'
          : 'weekly',
      recurrenceUntil:
        service.timeMode === 'duration' &&
        (prev.service?.timeMode !== 'duration' || prev.recurrence === 'none')
          ? prev.startsOn
          : prev.recurrenceUntil,
    }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.service
      return next
    })
    setServicePickerOpen(false)
  }

  function handleSpaceSelect(option: ServiceOption) {
    const space = spaceByIdRef.current.get(option.id)
    if (!space) return
    patchValues({ space })
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.space
      return next
    })
    setSpacePickerOpen(false)
  }

  function handleUserSelect(user: UserOption) {
    patchValues({ attendee: user })
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.attendee
      return next
    })
    setAttendeePickerOpen(false)
  }

  const stepKey = currentStepKey()
  const busy = saving || loading
  const isLastStep = step >= totalSteps
  const primaryLabel = saving
    ? isNew
      ? 'Creating…'
      : 'Saving…'
    : isLastStep
      ? isNew
        ? 'Create event'
        : 'Save changes'
      : 'Next'

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={(next) => {
          if (saving) return
          onOpenChange(next)
        }}
        title={stepTitles[step - 1]}
        description={stepDescriptions[step - 1]}
        {...DIALOG_SIZE}
        nestedDismissGuard={servicePickerOpen || spacePickerOpen || attendeePickerOpen}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className={OUTLINE_FOOTER}
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className={OUTLINE_FOOTER}
                disabled={busy}
                onClick={() => setStep((prev) => parseEventWizardStep(prev - 1, totalSteps))}
              >
                <ChevronLeft className="mr-2 h-4 w-4" aria-hidden />
                Previous
              </Button>
            ) : null}
            <Button
              type="button"
              className="h-10 px-4"
              disabled={busy}
              onClick={() => void handlePrimary()}
            >
              {isLastStep ? <Save className="mr-2 h-4 w-4" aria-hidden /> : null}
              {primaryLabel}
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
            <EventWizardProgress currentStep={step} totalSteps={totalSteps} />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {stepKey === 'service' ? (
                <EventWizardStepService
                  service={values.service}
                  onOpenPicker={() => setServicePickerOpen(true)}
                  error={fieldErrors.service}
                />
              ) : null}
              {stepKey === 'staff' ? (
                <EventWizardStepStaff
                  staff={staffList}
                  selectedId={values.staff?.id ?? null}
                  search={staffSearch}
                  onSearchChange={setStaffSearch}
                  onSelect={(staff) =>
                    patchValues({
                      staff,
                      weekdays: [],
                    })
                  }
                  error={fieldErrors.staff}
                />
              ) : null}
              {stepKey === 'attendee' ? (
                <EventWizardStepAttendee
                  attendee={values.attendee}
                  onOpenPicker={() => setAttendeePickerOpen(true)}
                  error={fieldErrors.attendee}
                />
              ) : null}
              {stepKey === 'where' ? (
                <EventWizardStepWhere
                  space={values.space}
                  onOpenPicker={() => setSpacePickerOpen(true)}
                  error={fieldErrors.space}
                />
              ) : null}
              {stepKey === 'when' && values.service && values.staff ? (
                <EventWizardStepWhen
                  service={values.service}
                  staff={values.staff}
                  startsOn={values.startsOn}
                  startTime={values.startTime}
                  weekdays={values.weekdays}
                  recurrence={values.recurrence}
                  recurrenceUntil={values.recurrenceUntil}
                  onChange={(patch) => patchValues(patch)}
                  errors={fieldErrors}
                />
              ) : null}
              {stepKey === 'summary' ? <EventWizardStepSummary values={values} /> : null}
            </>
          )}
        </div>
      </CustomDialog>

      <ServiceSelectionDialog
        open={servicePickerOpen}
        onOpenChange={setServicePickerOpen}
        title="Select service"
        description="Choose a company catalog service for this event."
        loadServices={loadServices}
        emptyMessage="No services found. Add a company service first."
        chrome="dialog"
        onSelect={handleServiceSelect}
      />

      <ServiceSelectionDialog
        open={spacePickerOpen}
        onOpenChange={setSpacePickerOpen}
        title="Select space"
        description="Choose the company space where this event happens."
        searchPlaceholder="Search spaces…"
        loadServices={loadSpaces}
        emptyMessage="No spaces found. Add a company space first."
        chrome="dialog"
        onSelect={handleSpaceSelect}
      />

      <UserSelectionDialog
        open={attendeePickerOpen}
        onOpenChange={setAttendeePickerOpen}
        title="Select attendee"
        description="Choose an Identity user for this event."
        loadUsers={loadUsers}
        emptyMessage="No users found."
        chrome="dialog"
        onSelect={handleUserSelect}
      />
    </>
  )
}
