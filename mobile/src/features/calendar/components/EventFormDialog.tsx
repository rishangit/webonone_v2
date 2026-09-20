import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  CustomDialog,
  Spinner,
  UserSelectionDialog,
  type UserOption,
  useToast,
} from '@webonone/mobile-ui'
import { EventWizardProgress } from '@/features/calendar/components/event-wizard/EventWizardProgress'
import { EventWizardStepAttendee } from '@/features/calendar/components/event-wizard/EventWizardStepAttendee'
import { EventWizardStepService } from '@/features/calendar/components/event-wizard/EventWizardStepService'
import { EventWizardStepSummary } from '@/features/calendar/components/event-wizard/EventWizardStepSummary'
import { EventWizardStepWhen } from '@/features/calendar/components/event-wizard/EventWizardStepWhen'
import { ServicePickerDialog } from '@/features/calendar/components/ServicePickerDialog'
import {
  EMPTY_EVENT_WIZARD_VALUES,
  eventWizardStepAttendeeSchema,
  eventWizardStepServiceSchema,
  eventWizardStepWhenDurationSchema,
  eventWizardStepWhenWindowSchema,
  eventWizardTotalSteps,
  mapZodIssuesToFieldErrors,
  parseEventWizardStep,
  toCreateEventPayload,
  toUpdateEventPayload,
  valuesFromEvent,
  type EventWizardFormValues,
  type EventWizardStep,
} from '@/features/calendar/schemas/eventSchemas'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import { loadIdentityUsers } from '@/features/calendar/services/identityUsersApi'
import type { CompanyEvent } from '@/features/calendar/types/event.types'

type EventFormDialogProps = {
  open: boolean
  id?: string
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
  const isNew = !id
  const [step, setStep] = useState<EventWizardStep>(parseEventWizardStep(initialStep))
  const [values, setValues] = useState<EventWizardFormValues>(EMPTY_EVENT_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [servicePickerOpen, setServicePickerOpen] = useState(false)
  const [attendeePickerOpen, setAttendeePickerOpen] = useState(false)
  const [pickerUsers, setPickerUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const isDuration = values.service?.timeMode === 'duration'
  const stepTitles = useMemo(
    () => (isDuration ? ['Service', 'Attendee', 'When', 'Summary'] : ['Service', 'When', 'Summary']),
    [isDuration],
  )
  const stepDescriptions = useMemo(() => {
    if (isDuration) {
      return [
        'Select the company service for this event.',
        'Select the Identity user attending this event.',
        'Pick the date and start time; optionally repeat weekly, biweekly, or monthly.',
        isNew ? 'Review and create the event.' : 'Review and save changes.',
      ]
    }
    return [
      'Select the company service for this event.',
      'Select weekdays and the From–Until range (service time is fixed).',
      isNew ? 'Review and create the event.' : 'Review and save changes.',
    ]
  }, [isDuration, isNew])
  const totalSteps = stepTitles.length

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    setError(null)
    setSaving(false)
    setServicePickerOpen(false)
    setAttendeePickerOpen(false)

    let cancelled = false
    setLoading(true)

    async function bootstrap() {
      try {
        if (isNew) {
          setValues({ ...EMPTY_EVENT_WIZARD_VALUES })
          setStep(parseEventWizardStep(initialStep, 4))
          return
        }
        const event = await eventsApi.get(id!)
        if (cancelled) return
        setValues(valuesFromEvent(event))
        setStep(parseEventWizardStep(initialStep, eventWizardTotalSteps(event.timeMode)))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load wizard data')
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

  useEffect(() => {
    if (!attendeePickerOpen) return
    let cancelled = false
    setLoadingUsers(true)
    void loadIdentityUsers({ pageSize: 100 })
      .then((result) => {
        if (!cancelled) setPickerUsers(result.users)
      })
      .catch(() => {
        if (!cancelled) setPickerUsers([])
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false)
      })
    return () => {
      cancelled = true
    }
  }, [attendeePickerOpen])

  function patchValues(patch: Partial<EventWizardFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function currentStepKey(): 'service' | 'attendee' | 'when' | 'summary' {
    if (isDuration) {
      return (['service', 'attendee', 'when', 'summary'] as const)[step - 1] ?? 'summary'
    }
    return (['service', 'when', 'summary'] as const)[step - 1] ?? 'summary'
  }

  function validateStep(current: EventWizardStep): boolean {
    const key = (() => {
      if (isDuration) return (['service', 'attendee', 'when', 'summary'] as const)[current - 1]
      return (['service', 'when', 'summary'] as const)[current - 1]
    })()
    if (key === 'service') {
      const parsed = eventWizardStepServiceSchema.safeParse({ service: values.service })
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    if (key === 'attendee') {
      const parsed = eventWizardStepAttendeeSchema.safeParse({ attendee: values.attendee })
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    if (key === 'when') {
      const parsed = isDuration
        ? eventWizardStepWhenDurationSchema.safeParse(values)
        : eventWizardStepWhenWindowSchema.safeParse(values)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    setFieldErrors({})
    return true
  }

  async function handleSave() {
    if (!validateStep(1)) {
      setStep(1)
      return
    }
    if (isDuration && !validateStep(2)) {
      setStep(2)
      return
    }
    const whenStep = (isDuration ? 3 : 2) as EventWizardStep
    if (!validateStep(whenStep)) {
      setStep(whenStep)
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
      const message = err instanceof Error ? err.message : 'Failed to save event'
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

  const nestedOpen = servicePickerOpen || attendeePickerOpen
  const title = isNew ? 'Create event' : 'Edit event'
  const description = stepDescriptions[step - 1] ?? ''

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        sizeWidth="large"
        sizeHeight="xlarge"
        nestedDismissGuard={nestedOpen}
        footer={
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            {step > 1 ? (
              <Button
                variant="outline"
                onPress={() => setStep((step - 1) as EventWizardStep)}
                disabled={saving}
              >
                Previous
              </Button>
            ) : null}
            {step < totalSteps ? (
              <Button
                onPress={() => {
                  if (validateStep(step)) setStep((step + 1) as EventWizardStep)
                }}
                disabled={saving || loading}
              >
                Next
              </Button>
            ) : (
              <Button onPress={() => void handleSave()} disabled={saving || loading}>
                {saving ? 'Saving…' : isNew ? 'Create event' : 'Save'}
              </Button>
            )}
          </View>
        }
      >
        <EventWizardProgress step={step} total={totalSteps} title={stepTitles[step - 1] ?? 'Step'} />
        {loading ? <Spinner label="Loading event…" /> : null}
        {error ? <Body className="mt-4 text-destructive">{error}</Body> : null}

        {!loading && currentStepKey() === 'service' ? (
          <EventWizardStepService
            service={values.service}
            error={fieldErrors.service}
            onOpenPicker={() => setServicePickerOpen(true)}
          />
        ) : null}
        {!loading && currentStepKey() === 'attendee' ? (
          <EventWizardStepAttendee
            attendee={values.attendee}
            error={fieldErrors.attendee}
            disabled={saving}
            onOpenPicker={() => setAttendeePickerOpen(true)}
          />
        ) : null}
        {!loading && currentStepKey() === 'when' && values.service ? (
          <EventWizardStepWhen
            service={values.service}
            startsOn={values.startsOn}
            startTime={values.startTime}
            weekdays={values.weekdays}
            recurrence={values.recurrence}
            recurrenceUntil={values.recurrenceUntil}
            errors={fieldErrors}
            onChange={patchValues}
          />
        ) : null}
        {!loading && currentStepKey() === 'summary' ? <EventWizardStepSummary values={values} /> : null}
      </CustomDialog>

      <ServicePickerDialog
        open={servicePickerOpen}
        selectedId={values.service?.id}
        onOpenChange={setServicePickerOpen}
        onSelect={(service) => patchValues({ service })}
      />

      <UserSelectionDialog
        open={attendeePickerOpen}
        onOpenChange={setAttendeePickerOpen}
        users={loadingUsers ? [] : pickerUsers}
        selectedId={values.attendee?.id}
        title="Select attendee"
        onSelect={(user) => {
          patchValues({ attendee: user })
          setAttendeePickerOpen(false)
        }}
      />
    </>
  )
}
