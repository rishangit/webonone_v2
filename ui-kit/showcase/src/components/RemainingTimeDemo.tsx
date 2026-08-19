import {
  ItemList,
  ItemListContent,
  ItemListItem,
  RemainingTime,
} from '@webonone/ui-kit'
import { DemoSection } from '@/components/DemoSection'

const NOW = new Date('2026-08-20T12:00:00')

const SAMPLES: { title: string; start: string; end: string }[] = [
  {
    title: 'Minutes remaining',
    start: '2026-08-20T12:12:00',
    end: '2026-08-20T13:00:00',
  },
  {
    title: 'Hours and minutes',
    start: '2026-08-20T15:15:00',
    end: '2026-08-20T16:00:00',
  },
  {
    title: 'Hours only',
    start: '2026-08-20T15:00:00',
    end: '2026-08-20T16:00:00',
  },
  {
    title: 'Days and hours',
    start: '2026-08-22T17:00:00',
    end: '2026-08-22T18:00:00',
  },
  {
    title: 'Whole days',
    start: '2026-08-25T12:00:00',
    end: '2026-08-25T13:00:00',
  },
  {
    title: 'In progress',
    start: '2026-08-20T11:00:00',
    end: '2026-08-20T12:45:00',
  },
  {
    title: 'Ended',
    start: '2026-08-20T09:00:00',
    end: '2026-08-20T10:00:00',
  },
]

export function RemainingTimeDemo() {
  return (
    <DemoSection
      id="remaining-time"
      title="Remaining time"
      description="Compact remaining duration on the right of a list row: 12min, 3hrs 15 min, 2days 5hrs, 5days. In-progress rows show time until end; ended rows show Ended."
    >
      <ItemList>
        {SAMPLES.map((sample) => (
          <ItemListItem key={sample.title}>
            <ItemListContent>
              <p className="truncate font-medium text-foreground">{sample.title}</p>
            </ItemListContent>
            <RemainingTime start={sample.start} end={sample.end} now={NOW} />
          </ItemListItem>
        ))}
      </ItemList>
    </DemoSection>
  )
}
