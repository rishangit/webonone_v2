import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  DatePicker,
  FormField,
  useToast,
} from '@webonone/ui-kit'
import { eventsApi } from '@/features/calendar/services/eventsApi'

const OUTLINE_FOOTER =
  'h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent'

const YMD = /^\d{4}-\d{2}-\d{2}$/

function toDate(ymd: string): Date | undefined {
  if (!YMD.test(ymd)) return undefined
  return new Date(`${ymd}T12:00:00`)
}

function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysYmd(ymd: string, days: number): string {
  const date = toDate(ymd)
  if (!date) return ymd
  date.setDate(date.getDate() + days)
  return toYmd(date)
}

export type ExpandEventUntilDialogProps = {
  open: boolean
  eventId: string
  startsOn: string
  currentUntil: string
  onOpenChange: (open: boolean) => void
  onExpanded: () => void
}

export function ExpandEventUntilDialog({
  open,
  eventId,
  startsOn,
  currentUntil,
  onOpenChange,
  onExpanded,
}: ExpandEventUntilDialogProps) {
  const { t } = useTranslation('calendar')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [until, setUntil] = useState(addDaysYmd(currentUntil, 7))
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setUntil(addDaysYmd(currentUntil, 7))
    setSaving(false)
    setSubmitError(null)
  }, [open, currentUntil])

  const validationError = useMemo(() => {
    if (!YMD.test(until)) return t('sessionsList.expand.invalidDate')
    if (until <= currentUntil) return t('sessionsList.expand.mustBeAfter')
    if (until < startsOn) return t('sessionsList.expand.mustBeOnOrAfterStart')
    return null
  }, [currentUntil, startsOn, t, until])

  const canSave = !validationError && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setSubmitError(null)
    try {
      await eventsApi.update(eventId, { recurrence_until: until })
      toast({ title: t('sessionsList.expand.toastSuccess') })
      onExpanded()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('sessionsList.expand.toastFailed')
      setSubmitError(message)
      toast({
        title: t('sessionsList.expand.toastFailed'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('sessionsList.expand.title')}
      description={t('sessionsList.expand.description')}
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className={OUTLINE_FOOTER}
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          <Button type="button" disabled={!canSave} onClick={() => void handleSave()}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {saving ? t('sessionsList.expand.saving') : tc('save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {submitError ? (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t('sessionsList.expand.currentUntil')}
          </p>
          <p className="text-sm text-foreground">{currentUntil}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => setUntil(addDaysYmd(currentUntil, 7))}
          >
            {t('sessionsList.expand.plusOneWeek')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => setUntil(addDaysYmd(currentUntil, 14))}
          >
            {t('sessionsList.expand.plusTwoWeeks')}
          </Button>
        </div>

        <FormField
          label={t('sessionsList.expand.newUntil')}
          htmlFor="expand-event-until"
          required
          error={validationError ?? undefined}
        >
          <DatePicker
            id="expand-event-until"
            value={toDate(until)}
            onChange={(date) => setUntil(date ? toYmd(date) : '')}
            withIcon
            disabled={saving}
            placeholder={t('sessionsList.expand.placeholder')}
            isDateDisabled={(date) => toYmd(date) <= currentUntil || toYmd(date) < startsOn}
          />
        </FormField>
      </div>
    </CustomDialog>
  )
}
