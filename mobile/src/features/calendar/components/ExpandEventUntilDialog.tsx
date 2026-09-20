import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  DateField,
  useToast,
} from '@webonone/mobile-ui'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import { addDaysYmd, parseYmd, toYmd, todayYmd } from '@/features/calendar/utils/dateYmd'
import { formatCalendarYmd } from '@/shared/utils/formatDisplayDate'
import { Body, Muted } from '@webonone/mobile-ui'

type ExpandEventUntilDialogProps = {
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
  const { toast } = useToast()
  const [from, setFrom] = useState(todayYmd())
  const [until, setUntil] = useState(addDaysYmd(todayYmd(), 7))
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const initialFrom = todayYmd()
    setFrom(initialFrom)
    setUntil(addDaysYmd(initialFrom, 7))
    setSaving(false)
    setSubmitError(null)
  }, [open, currentUntil])

  const untilBase = from > currentUntil ? from : currentUntil

  const fromError = useMemo(() => {
    if (!parseYmd(from)) return 'Use YYYY-MM-DD format'
    if (from < startsOn) return 'From must be on or after the start date.'
    return null
  }, [from, startsOn])

  const untilError = useMemo(() => {
    if (!parseYmd(until)) return 'Use YYYY-MM-DD format'
    if (until < from) return 'Until must be on or after From.'
    if (until <= currentUntil) return 'Choose a date after the current until date.'
    return null
  }, [currentUntil, from, until])

  const canSave = !fromError && !untilError && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setSubmitError(null)
    try {
      await eventsApi.update(eventId, { recurrence_until: until, expand_from: from })
      toast({ title: 'Series expanded' })
      onExpanded()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to expand series'
      setSubmitError(message)
      toast({ title: 'Failed to expand series', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Expand series"
      description="Choose From and Until to add more session days. Days between the current until and From are skipped so un-held days stay empty."
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <View className="flex-row flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={saving} onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSave} onPress={() => void handleSave()}>
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
        <View className="gap-1">
          <Muted>Current until</Muted>
          <Body>{formatCalendarYmd(currentUntil)}</Body>
        </View>
        <Muted>
          {from > currentUntil
            ? 'Days after the current until and before From will not get sessions. Move From earlier later if you need to fill that gap.'
            : 'Existing sessions through the current until stay unchanged. New sessions are added after that date through Until.'}
        </Muted>
        <View className="flex-row flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onPress={() => setUntil(addDaysYmd(untilBase, 7))}
          >
            +1 week
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onPress={() => setUntil(addDaysYmd(untilBase, 14))}
          >
            +2 weeks
          </Button>
        </View>
        <DateField
          label="From"
          required
          value={parseYmd(from)}
          onChange={(date) => setFrom(date ? toYmd(date) : '')}
          error={fromError ?? undefined}
          placeholder="First new session day"
        />
        <DateField
          label="Until"
          required
          value={parseYmd(until)}
          onChange={(date) => setUntil(date ? toYmd(date) : '')}
          error={untilError ?? undefined}
          placeholder="Series end"
        />
      </View>
    </CustomDialog>
  )
}
