import { useLocalSearchParams } from 'expo-router'
import { EventDetailScreen } from '@/features/calendar/screens/EventDetailScreen'

export default function CalendarEventDetailRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>()
  if (!eventId) return null
  return <EventDetailScreen eventId={eventId} />
}
