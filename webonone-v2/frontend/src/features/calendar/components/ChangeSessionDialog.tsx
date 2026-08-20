import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  CustomDialog,
  FormField,
  Input,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { sessionTokensActions } from '@/features/calendar/store'
import { sessionTokensApi } from '@/features/calendar/services/sessionTokensApi'

const OUTLINE_FOOTER =
  'h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent'

function addMinutesToTime(hhmm: string, minutes: number): string {
  const [hRaw, mRaw] = hhmm.split(':').map(Number)
  const total = (hRaw ?? 0) * 60 + (mRaw ?? 0) + minutes
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export type ChangeSessionDialogProps = {
  open: boolean
  eventId: string
  occurrenceDate: string
  currentStartTime: string
  currentEndTime: string
  relatedMemberCount: number
  onOpenChange: (open: boolean) => void
}

export function ChangeSessionDialog({
  open,
  eventId,
  occurrenceDate,
  currentStartTime,
  currentEndTime,
  relatedMemberCount,
  onOpenChange,
}: ChangeSessionDialogProps) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [delayHours, setDelayHours] = useState('0')
  const [delayMinutes, setDelayMinutes] = useState('30')
  const [sendEmail, setSendEmail] = useState(true)
  const [sendSms, setSendSms] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDelayHours('0')
    setDelayMinutes('30')
    setSendEmail(relatedMemberCount > 0)
    setSendSms(relatedMemberCount > 0)
    setSaving(false)
    setSubmitError(null)
  }, [open, relatedMemberCount])

  const hoursNum = Number.parseInt(delayHours, 10)
  const minutesNum = Number.parseInt(delayMinutes, 10)
  const delayTotal =
    (Number.isFinite(hoursNum) && hoursNum >= 0 ? hoursNum : 0) * 60 +
    (Number.isFinite(minutesNum) && minutesNum >= 0 ? minutesNum : 0)

  const preview = useMemo(() => {
    if (delayTotal < 1) {
      return { start: currentStartTime, end: currentEndTime, valid: false, reason: null as string | null }
    }
    if (
      timeToMinutes(currentStartTime) + delayTotal >= 24 * 60 ||
      timeToMinutes(currentEndTime) + delayTotal >= 24 * 60
    ) {
      return {
        start: currentStartTime,
        end: currentEndTime,
        valid: false,
        reason: 'Delay would move the session past midnight.',
      }
    }
    return {
      start: addMinutesToTime(currentStartTime, delayTotal),
      end: addMinutesToTime(currentEndTime, delayTotal),
      valid: true,
      reason: null,
    }
  }, [currentEndTime, currentStartTime, delayTotal])

  const canSave = preview.valid && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setSubmitError(null)
    try {
      const result = await sessionTokensApi.changeSchedule(eventId, occurrenceDate, {
        delayHours: Number.isFinite(hoursNum) && hoursNum >= 0 ? hoursNum : 0,
        delayMinutes: Number.isFinite(minutesNum) && minutesNum >= 0 ? minutesNum : 0,
        sendEmail: relatedMemberCount > 0 ? sendEmail : false,
        sendSms: relatedMemberCount > 0 ? sendSms : false,
      })
      dispatch(sessionTokensActions.fetchListSucceeded(result))
      const notifyParts: string[] = []
      if (result.emailQueued > 0) notifyParts.push(`${result.emailQueued} email`)
      if (result.smsQueued > 0) notifyParts.push(`${result.smsQueued} SMS`)
      toast({
        title: 'Session time updated',
        description:
          notifyParts.length > 0
            ? `New time ${result.sessionStartTime}–${result.sessionEndTime}. Queued ${notifyParts.join(' and ')}.`
            : `New time ${result.sessionStartTime}–${result.sessionEndTime}.`,
      })
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change session'
      setSubmitError(message)
      toast({
        title: 'Failed to change session',
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
      title="Change session"
      description="Delay this session’s start time and optionally notify related members."
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
            Cancel
          </Button>
          <Button type="button" disabled={!canSave} onClick={() => void handleSave()}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {saving ? 'Saving…' : 'Save'}
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
          <p className="text-xs font-medium text-muted-foreground">Current time</p>
          <p className="text-sm text-foreground">
            {currentStartTime}–{currentEndTime}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Delay hours" htmlFor="change-session-hours">
            <Input
              id="change-session-hours"
              type="number"
              min={0}
              max={24}
              value={delayHours}
              disabled={saving}
              onChange={(e) => setDelayHours(e.target.value)}
            />
          </FormField>
          <FormField label="Delay minutes" htmlFor="change-session-minutes">
            <Input
              id="change-session-minutes"
              type="number"
              min={0}
              max={59}
              value={delayMinutes}
              disabled={saving}
              onChange={(e) => setDelayMinutes(e.target.value)}
            />
          </FormField>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">New time</p>
          <p className="text-sm font-medium text-foreground">
            {preview.valid ? `${preview.start}–${preview.end}` : '—'}
          </p>
          {preview.reason ? (
            <p className="text-sm text-destructive">{preview.reason}</p>
          ) : null}
          {delayTotal < 1 ? (
            <p className="text-sm text-muted-foreground">Enter a delay of at least 1 minute.</p>
          ) : null}
        </div>

        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <p className="text-sm text-muted-foreground">
            {relatedMemberCount > 0
              ? `Notify ${relatedMemberCount} related member${relatedMemberCount === 1 ? '' : 's'} about the new schedule.`
              : 'No related members to notify yet.'}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={sendEmail}
              disabled={saving || relatedMemberCount === 0}
              onCheckedChange={(checked) => setSendEmail(checked === true)}
            />
            Send email
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={sendSms}
              disabled={saving || relatedMemberCount === 0}
              onCheckedChange={(checked) => setSendSms(checked === true)}
            />
            Send SMS
          </label>
        </div>
      </div>
    </CustomDialog>
  )
}
