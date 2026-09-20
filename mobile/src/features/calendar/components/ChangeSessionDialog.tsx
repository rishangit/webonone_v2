import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  CustomDialog,
  FormField,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { sessionTokensApi } from '@/features/calendar/services/sessionTokensApi'
import { Body, Muted } from '@webonone/mobile-ui'

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

type ChangeSessionDialogProps = {
  open: boolean
  eventId: string
  occurrenceDate: string
  currentStartTime: string
  currentEndTime: string
  relatedMemberCount: number
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}

export function ChangeSessionDialog({
  open,
  eventId,
  occurrenceDate,
  currentStartTime,
  currentEndTime,
  relatedMemberCount,
  onOpenChange,
  onChanged,
}: ChangeSessionDialogProps) {
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
      return { start: currentStartTime, end: currentEndTime, valid: false, reason: 'Enter a delay of at least 1 minute.' }
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
      reason: null as string | null,
    }
  }, [currentEndTime, currentStartTime, delayTotal])

  async function handleSave() {
    if (!preview.valid) return
    setSaving(true)
    setSubmitError(null)
    try {
      const result = await sessionTokensApi.changeSchedule(eventId, occurrenceDate, {
        delayHours: Number.isFinite(hoursNum) && hoursNum >= 0 ? hoursNum : 0,
        delayMinutes: Number.isFinite(minutesNum) && minutesNum >= 0 ? minutesNum : 0,
        sendEmail: relatedMemberCount > 0 ? sendEmail : false,
        sendSms: relatedMemberCount > 0 ? sendSms : false,
      })
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
      onChanged()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change session'
      setSubmitError(message)
      toast({ title: 'Failed to change session', description: message, variant: 'destructive' })
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
        <View className="flex-row flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={saving} onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!preview.valid || saving} onPress={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        {submitError ? (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
        <Muted>
          Current time {currentStartTime}–{currentEndTime}
        </Muted>
        <TextField
          label="Delay hours"
          value={delayHours}
          onChangeText={setDelayHours}
          keyboardType="number-pad"
        />
        <TextField
          label="Delay minutes"
          value={delayMinutes}
          onChangeText={setDelayMinutes}
          keyboardType="number-pad"
        />
        <FormField label="New time">
          <Body>
            {preview.start}–{preview.end}
          </Body>
          {preview.reason ? <Body className="text-destructive">{preview.reason}</Body> : null}
        </FormField>
        {relatedMemberCount > 0 ? (
          <>
            <Muted>
              Notify {relatedMemberCount} related member{relatedMemberCount === 1 ? '' : 's'} about the
              new schedule.
            </Muted>
            <Checkbox checked={sendEmail} onCheckedChange={setSendEmail} label="Send email" />
            <Checkbox checked={sendSms} onCheckedChange={setSendSms} label="Send SMS" />
          </>
        ) : (
          <Muted>No related members to notify yet.</Muted>
        )}
      </View>
    </CustomDialog>
  )
}
