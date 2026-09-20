import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  DateField,
  FormField,
  NativeSelect,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { parseYmd, toYmd } from '@/features/calendar/utils/dateYmd'
import {
  createEmptyStaffLeaveForm,
  mapZodIssuesToFieldErrors,
  staffLeaveFormSchema,
  toCreateStaffLeavePayload,
  type StaffLeaveFormValues,
} from '@/features/staff/schemas/staffLeaveSchemas'
import { LEAVE_TYPES } from '@/features/staff/types/staffLeave.types'

type StaffLeaveFormDialogProps = {
  open: boolean
  staffId: string
  onOpenChange: (open: boolean) => void
  onSubmit: (body: ReturnType<typeof toCreateStaffLeavePayload>) => Promise<void>
}

export function StaffLeaveFormDialog({
  open,
  staffId,
  onOpenChange,
  onSubmit,
}: StaffLeaveFormDialogProps) {
  const { t } = useTranslation('staff')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [values, setValues] = useState<StaffLeaveFormValues>(createEmptyStaffLeaveForm)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof StaffLeaveFormValues, string>>>(
    {},
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(createEmptyStaffLeaveForm())
    setFieldErrors({})
    setError(null)
    setSaving(false)
  }, [open, staffId])

  function updateField<K extends keyof StaffLeaveFormValues>(
    key: K,
    value: StaffLeaveFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function handleSubmit() {
    const parsed = staffLeaveFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setSaving(true)
    setError(null)
    try {
      await onSubmit(toCreateStaffLeavePayload(parsed.data))
      toast({ title: t('leaves.toastAdded') })
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('leaves.toastAddFailed')
      setError(message)
      toast({ title: t('leaves.toastAddFailed'), description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const leaveTypeOptions = LEAVE_TYPES.map((type) => ({
    value: type,
    label: t(`leaves.types.${type}`),
  }))

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('leaves.addTitle')}
      description={t('leaves.addDescription')}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <View className="flex-row flex-wrap justify-end gap-2">
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
            {tc('cancel')}
          </Button>
          <Button onPress={() => void handleSubmit()} disabled={saving}>
            {saving ? t('leaves.saving') : t('leaves.addSubmit')}
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          label={t('leaves.fields.type')}
          required
          error={fieldErrors.leaveType}
        >
          <NativeSelect
            value={values.leaveType}
            options={leaveTypeOptions}
            onValueChange={(value) =>
              updateField('leaveType', value as StaffLeaveFormValues['leaveType'])
            }
            placeholder={t('leaves.fields.typePlaceholder')}
          />
        </FormField>

        <DateField
          label={t('leaves.fields.from')}
          required
          value={values.startDate ? parseYmd(values.startDate) : undefined}
          onChange={(date) => updateField('startDate', date ? toYmd(date) : '')}
          placeholder={t('leaves.fields.fromPlaceholder')}
          error={fieldErrors.startDate}
        />

        <DateField
          label={t('leaves.fields.to')}
          required
          value={values.endDate ? parseYmd(values.endDate) : undefined}
          onChange={(date) => updateField('endDate', date ? toYmd(date) : '')}
          placeholder={t('leaves.fields.toPlaceholder')}
          error={fieldErrors.endDate}
        />

        <TextField
          label={t('leaves.fields.reason')}
          value={values.reason ?? ''}
          onChangeText={(text) => updateField('reason', text)}
          placeholder={t('leaves.fields.reasonPlaceholder')}
          error={fieldErrors.reason}
        />
      </View>
    </CustomDialog>
  )
}
