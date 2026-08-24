import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  DatePicker,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import {
  createEmptyStaffLeaveForm,
  staffLeaveFormSchema,
  toCreateStaffLeavePayload,
  type StaffLeaveFormValues,
} from '@/features/staff/schemas/staffLeaveSchemas'
import { LEAVE_TYPES } from '@/features/staff/types/staffLeave.types'

const DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

function toYmd(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseYmd(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export type StaffLeaveFormDialogProps = {
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

  function updateField<K extends keyof StaffLeaveFormValues>(key: K, value: StaffLeaveFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
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
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leaves.toastAddFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('leaves.addTitle')}
      description={t('leaves.addDescription')}
      sizeWidth={DIALOG_SIZE.sizeWidth}
      sizeHeight={DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common:cancel')}
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? t('leaves.saving') : t('leaves.addSubmit')}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          label={t('leaves.fields.type')}
          htmlFor="staff-leave-type"
          required
          error={fieldErrors.leaveType}
        >
          <Select
            value={values.leaveType}
            onValueChange={(value) => updateField('leaveType', value as StaffLeaveFormValues['leaveType'])}
          >
            <SelectTrigger id="staff-leave-type" className="w-full">
              <SelectValue placeholder={t('leaves.fields.typePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {LEAVE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`leaves.types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t('leaves.fields.from')}
            htmlFor="staff-leave-from"
            required
            error={fieldErrors.startDate}
          >
            <DatePicker
              id="staff-leave-from"
              withIcon
              value={parseYmd(values.startDate)}
              onChange={(date) => updateField('startDate', date ? toYmd(date) : '')}
              placeholder={t('leaves.fields.fromPlaceholder')}
            />
          </FormField>
          <FormField
            label={t('leaves.fields.to')}
            htmlFor="staff-leave-to"
            required
            error={fieldErrors.endDate}
          >
            <DatePicker
              id="staff-leave-to"
              withIcon
              value={parseYmd(values.endDate)}
              onChange={(date) => updateField('endDate', date ? toYmd(date) : '')}
              placeholder={t('leaves.fields.toPlaceholder')}
            />
          </FormField>
        </div>

        <FormField
          label={t('leaves.fields.reason')}
          htmlFor="staff-leave-reason"
          error={fieldErrors.reason}
        >
          <Input
            id="staff-leave-reason"
            value={values.reason ?? ''}
            onChange={(e) => updateField('reason', e.target.value)}
            placeholder={t('leaves.fields.reasonPlaceholder')}
          />
        </FormField>
      </form>
    </CustomDialog>
  )
}
