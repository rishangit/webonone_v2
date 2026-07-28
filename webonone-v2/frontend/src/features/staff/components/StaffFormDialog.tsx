import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  mapZodIssuesToFieldErrors,
  useToast,
  UserSelectionDialog,
  type UserOption,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import {
  EMPTY_STAFF_WIZARD_VALUES,
  parseStaffWizardStep,
  staffWizardStep1Schema,
  staffWizardStep2Schema,
  toCreateStaffPayload,
  toUpdateStaffPayload,
  valuesFromStaff,
  type StaffWizardFormValues,
  type StaffWizardStep,
} from '@/features/staff/schemas/staffSchemas'
import { StaffWizardProgress } from '@/features/staff/components/staff-wizard/StaffWizardProgress'
import { StaffWizardStepUser } from '@/features/staff/components/staff-wizard/StaffWizardStepUser'
import { StaffWizardStepSchedule } from '@/features/staff/components/staff-wizard/StaffWizardStepSchedule'
import { StaffWizardStepSummary } from '@/features/staff/components/staff-wizard/StaffWizardStepSummary'
import { loadIdentityUsersForStaff } from '@/features/staff/services/identityUsersApi'
import { staffApi } from '@/features/staff/services/staffApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

const TOTAL_STEPS = 3

const STAFF_WIZARD_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

const STEP_TITLES = ['User', 'Work schedule', 'Summary'] as const

export interface StaffFormDialogProps {
  open: boolean
  /** Omit for create; set for edit. */
  id?: string
  initialStep?: StaffWizardStep
  existingUserIds?: ReadonlySet<string>
  onOpenChange: (open: boolean) => void
  onSaved: (item: CompanyStaff) => void
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

export function StaffFormDialog({
  open,
  id,
  initialStep = 1,
  existingUserIds = new Set(),
  onOpenChange,
  onSaved,
}: StaffFormDialogProps) {
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const isNew = !id
  const [step, setStep] = useState<StaffWizardStep>(parseStaffWizardStep(initialStep))
  const [values, setValues] = useState<StaffWizardFormValues>(EMPTY_STAFF_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userPickerOpen, setUserPickerOpen] = useState(false)
  const [excludeUserIds, setExcludeUserIds] = useState<ReadonlySet<string>>(existingUserIds)

  useEffect(() => {
    if (!open) return
    const startStep = parseStaffWizardStep(initialStep)
    setStep(startStep)
    setFieldErrors({})
    setError(null)
    setSaving(false)
    setUserPickerOpen(false)
    setExcludeUserIds(existingUserIds)

    if (isNew) {
      setValues({
        user: null,
        schedule: EMPTY_STAFF_WIZARD_VALUES.schedule.map((day) => ({ ...day })),
      })
      setLoadingDetail(false)
      void staffApi.list({ page: 1, pageSize: 500, force: true }).then(
        (result) => {
          setExcludeUserIds(new Set(result.items.map((item) => item.userId)))
        },
        () => {
          /* keep prop-based exclude set */
        },
      )
      return
    }

    let cancelled = false
    setLoadingDetail(true)
    void staffApi
      .get(id)
      .then((staff) => {
        if (cancelled) return
        setValues(valuesFromStaff(staff))
        void staffApi.list({ page: 1, pageSize: 500, force: true }).then(
          (result) => {
            if (cancelled) return
            setExcludeUserIds(
              new Set(
                result.items.filter((item) => item.id !== id).map((item) => item.userId),
              ),
            )
          },
          () => {
            /* keep prop-based exclude set */
          },
        )
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load staff')
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, id, isNew, initialStep, existingUserIds])

  const loadUsers = useCallback(
    async (params: Parameters<typeof loadIdentityUsersForStaff>[1]) => {
      if (!accessToken) {
        throw new Error('Not signed in')
      }
      return loadIdentityUsersForStaff(accessToken, params, excludeUserIds)
    },
    [accessToken, excludeUserIds],
  )

  function validateStep(current: StaffWizardStep): boolean {
    if (current === 1) {
      const result = staffWizardStep1Schema.safeParse({ user: values.user })
      if (!result.success) {
        setFieldErrors(flattenZodFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }
    if (current === 2) {
      const result = staffWizardStep2Schema.safeParse({ schedule: values.schedule })
      if (!result.success) {
        setFieldErrors(flattenZodFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }
    return true
  }

  async function handlePrimary() {
    if (step < TOTAL_STEPS) {
      if (!validateStep(step)) return
      setStep((prev) => (prev + 1) as StaffWizardStep)
      return
    }

    if (!validateStep(1) || !validateStep(2)) {
      setStep(1)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const saved = isNew
        ? await staffApi.create(toCreateStaffPayload(values))
        : await staffApi.update(id, toUpdateStaffPayload(values))
      toast({ title: isNew ? 'Staff added' : 'Staff saved' })
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : isNew ? 'Failed to add staff' : 'Failed to save staff'
      setError(message)
      toast({
        title: isNew ? 'Failed to add staff' : 'Failed to save staff',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function handleUserSelect(user: UserOption) {
    setValues((prev) => ({
      ...prev,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
      },
    }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.user
      return next
    })
    setUserPickerOpen(false)
  }

  const stepDescriptions = useMemo(
    () =>
      [
        isNew
          ? 'Select the Identity user to add as staff.'
          : 'Change the Identity user linked to this staff record.',
        'Choose working days and hours for each day.',
        isNew ? 'Review and add the staff member.' : 'Review and save changes.',
      ] as const,
    [isNew],
  )

  const primaryLabel = useMemo(() => {
    if (saving) return 'Saving…'
    if (step < TOTAL_STEPS) return 'Next'
    return isNew ? 'Add staff' : 'Save changes'
  }, [isNew, saving, step])

  const busy = saving || loadingDetail

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={(next) => {
          if (saving) return
          onOpenChange(next)
        }}
        title={STEP_TITLES[step - 1]}
        description={stepDescriptions[step - 1]}
        {...STAFF_WIZARD_DIALOG_SIZE}
        nestedDismissGuard={userPickerOpen}
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy || step === 1}
              onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as StaffWizardStep) : prev))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </Button>
            <Button type="button" disabled={busy} onClick={() => void handlePrimary()}>
              {primaryLabel}
              {step < TOTAL_STEPS ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <StaffWizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {loadingDetail ? (
            <p className="text-sm text-muted-foreground">Loading staff…</p>
          ) : (
            <>
              {step === 1 ? (
                <StaffWizardStepUser
                  values={values}
                  fieldErrors={fieldErrors}
                  isSubmitting={busy}
                  onSelectUser={() => setUserPickerOpen(true)}
                  onClearUser={() => setValues((prev) => ({ ...prev, user: null }))}
                />
              ) : null}
              {step === 2 ? (
                <StaffWizardStepSchedule
                  values={values}
                  fieldErrors={fieldErrors}
                  isSubmitting={busy}
                  onChange={(schedule) => setValues((prev) => ({ ...prev, schedule }))}
                />
              ) : null}
              {step === 3 ? <StaffWizardStepSummary values={values} /> : null}
            </>
          )}
        </div>
      </CustomDialog>

      <UserSelectionDialog
        open={userPickerOpen}
        onOpenChange={setUserPickerOpen}
        onSelect={handleUserSelect}
        loadUsers={loadUsers}
        title="Select staff user"
        description="Choose an Identity user to link as company staff."
        emptyMessage="No users found."
        chrome="dialog"
      />
    </>
  )
}
