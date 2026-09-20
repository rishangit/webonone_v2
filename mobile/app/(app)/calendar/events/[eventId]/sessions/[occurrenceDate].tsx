import { useLocalSearchParams } from 'expo-router'
import { SessionDetailScreen } from '@/features/calendar/screens/SessionDetailScreen'

export default function CalendarSessionDetailRoute() {
  const { eventId, occurrenceDate } = useLocalSearchParams<{
    eventId: string
    occurrenceDate: string
  }>()
  if (!eventId || !occurrenceDate) return null
  return <SessionDetailScreen eventId={eventId} occurrenceDate={occurrenceDate} />
}
