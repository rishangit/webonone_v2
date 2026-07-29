import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './Button'

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  /** When true, day is not selectable. */
  isDateDisabled?: (date: Date) => boolean
  className?: string
}

function Calendar({ selected, onSelect, isDateDisabled, className }: CalendarProps) {
  const [viewDate, setViewDate] = React.useState(() => selected ?? new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  function selectDay(day: number) {
    const next = new Date(year, month, day)
    if (isDateDisabled?.(next)) return
    onSelect?.(next)
  }

  function isSelected(day: number) {
    if (!selected) return false
    return (
      selected.getFullYear() === year &&
      selected.getMonth() === month &&
      selected.getDate() === day
    )
  }

  function isToday(day: number) {
    const today = new Date()
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  function isDisabled(day: number) {
    if (!isDateDisabled) return false
    return isDateDisabled(new Date(year, month, day))
  }

  return (
    <div className={cn('p-3', className)}>
      <div className="mb-4 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
        {days.map((day, i) =>
          day === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <button
              key={day}
              type="button"
              disabled={isDisabled(day)}
              onClick={() => selectDay(day)}
              className={cn(
                'h-8 w-8 rounded-md text-sm transition-colors hover:bg-accent',
                isSelected(day) && 'bg-primary text-primary-foreground hover:bg-primary/90',
                isToday(day) && !isSelected(day) && 'ring-1 ring-ring',
                isDisabled(day) &&
                  'cursor-not-allowed opacity-40 hover:bg-transparent',
              )}
            >
              {day}
            </button>
          ),
        )}
      </div>
    </div>
  )
}

export { Calendar }
