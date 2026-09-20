import { useCallback, useEffect, useState } from 'react'
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
import { StaffWizardProgress } from '@/features/staff/components/staff-wizard/StaffWizardProgress'
import { StaffWizardStepSchedule } from '@/features/staff/components/staff-wizard/StaffWizardStepSchedule'
import { StaffWizardStepSummary } from '@/features/staff/components/staff-wizard/StaffWizardStepSummary'
import { StaffWizardStepUser } from '@/features/staff/components/staff-wizard/StaffWizardStepUser'
import {
  EMPTY_STAFF_WIZARD_VALUES,
  mapZodIssuesToFieldErrors,
  parseStaffWizardStep,
  staffWizardStep1Schema,
  staffWizardStep2Schema,
  toCreateStaffPayload,
  toUpdateStaffPayload,
  valuesFromStaff,
  type StaffWizardFormValues,
  type StaffWizardStep,
} from '@/features/staff/schemas/staffSchemas'
import { loadIdentityUsersForStaff } from '@/features/staff/services/identityUsersApi'
import { staffApi } from '@/features/staff/services/staffApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

const TOTAL_STEPS = 3

type StaffFormDialogProps = {
  open: boolean
  id?: string
  initialStep?: StaffWizardStep
  existingUserIds?: ReadonlySet<string>
  onOpenChange: (open: boolean) => void
  onSaved: (item: CompanyStaff) => void
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
  const isNew = !id
  const [step, setStep] = useState<StaffWizardStep>(parseStaffWizardStep(initialStep))
  const [values, setValues] = useState<StaffWizardFormValues>(EMPTY_STAFF_WIZARD_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userPickerOpen, setUserPickerOpen] = useState(false)
  const [pickerUsers, setPickerUsers] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [excludeUserIds, setExcludeUserIds] = useState<ReadonlySet<string>>(existingUserIds)

  const loadPickerUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const result = await loadIdentityUsersForStaff({
        pageSize: 100,
        excludeUserIds,
      })
      setPickerUsers(result.users)
    } catch {
      setPickerUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }, [excludeUserIds])

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
      void staffApi.list({ page: 1, pageSize: 500 }).then(
        (result) => {
          setExcludeUserIds(new Set(result.items.map((item) => item.userId)))
        },
        () => undefined,
      )
      return
    }

    let cancelled = false
    setLoadingDetail(true)
    staffApi
      .get(id!)
      .then((staff) => {
        if (!cancelled) setValues(valuesFromStaff(staff))
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load staff')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })

    return () => {
      cancelled = true
    }
  }, [existingUserIds, id, initialStep, isNew, open])

  useEffect(() => {
    if (userPickerOpen) void loadPickerUsers()
  }, [loadPickerUsers, userPickerOpen])

  function validateStep(current: StaffWizardStep): boolean {
    if (current === 1) {
      const parsed = staffWizardStep1Schema.safeParse({ user: values.user })
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    if (current === 2) {
      const parsed = staffWizardStep2Schema.safeParse({ schedule: values.schedule })
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return false
      }
    }
    setFieldErrors({})
    return true
  }

  async function handleSave() {
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const saved = isNew
        ? await staffApi.create(toCreateStaffPayload(values))
        : await staffApi.update(id!, toUpdateStaffPayload(values))
      toast({ title: isNew ? 'Staff added' : 'Staff updated' })
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff')
      toast({
        title: 'Failed to save staff',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const title = isNew ? 'Add staff' : 'Edit staff'
  const description =
    step === 1
      ? 'Link a registered user to this company staff record.'
      : step === 2
        ? 'Set weekly working days and hours.'
        : 'Review before saving.'

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        sizeWidth="medium"
        sizeHeight="large"
        nestedDismissGuard={userPickerOpen}
        footer={
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            {step > 1 ? (
              <Button variant="outline" onPress={() => setStep((step - 1) as StaffWizardStep)} disabled={saving}>
                Previous
              </Button>
            ) : null}
            {step < TOTAL_STEPS ? (
              <Button
                onPress={() => {
                  if (validateStep(step)) setStep((step + 1) as StaffWizardStep)
                }}
                disabled={saving || loadingDetail}
              >
                Next
              </Button>
            ) : (
              <Button onPress={() => void handleSave()} disabled={saving || loadingDetail}>
                {saving ? 'Saving…' : isNew ? 'Add staff' : 'Save'}
              </Button>
            )}
          </View>
        }
      >
        <StaffWizardProgress step={step} />
        {loadingDetail ? <Spinner label="Loading staff…" /> : null}
        {error ? <Body className="mt-4 text-destructive">{error}</Body> : null}

        {!loadingDetail && step === 1 ? (
          <StaffWizardStepUser
            values={values}
            fieldErrors={fieldErrors}
            disabled={saving}
            onPickUser={() => setUserPickerOpen(true)}
          />
        ) : null}
        {!loadingDetail && step === 2 ? (
          <StaffWizardStepSchedule
            values={values}
            fieldErrors={fieldErrors}
            disabled={saving}
            onChange={(schedule) => setValues((current) => ({ ...current, schedule }))}
          />
        ) : null}
        {!loadingDetail && step === 3 ? <StaffWizardStepSummary values={values} /> : null}
      </CustomDialog>

      <UserSelectionDialog
        open={userPickerOpen}
        onOpenChange={setUserPickerOpen}
        users={loadingUsers ? [] : pickerUsers}
        selectedId={values.user?.id}
        title="Select user"
        onSelect={(user) => {
          setValues((current) => ({
            ...current,
            user: {
              id: user.id,
              displayName: user.displayName,
              email: user.email,
              avatarUrl: user.avatarUrl ?? null,
            },
          }))
          setUserPickerOpen(false)
        }}
      />
    </>
  )
}
