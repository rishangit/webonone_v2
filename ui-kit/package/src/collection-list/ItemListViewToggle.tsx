import { LayoutGrid, List, Table2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/Button'
import { resolveCollectionDisplayMode, type ListDisplayMode } from './listDisplayMode'

export interface ItemListViewToggleProps {
  value: ListDisplayMode
  onChange: (mode: ListDisplayMode) => void
  className?: string
  /**
   * When false, only list and grid toggles are shown (collections without entity images).
   * Global preference `card` is shown as list until the user picks grid.
   */
  cardLayout?: boolean
  /**
   * When false, only list and card toggles are shown (media pickers).
   * Global preference `grid` is shown as list until the user picks list or card.
   */
  gridLayout?: boolean
  /** Defaults: List view, Grid view, Card view */
  listLabel?: string
  gridLabel?: string
  cardLabel?: string
}

const MODES: { mode: ListDisplayMode; icon: typeof List; labelKey: 'list' | 'grid' | 'card' }[] = [
  { mode: 'list', icon: List, labelKey: 'list' },
  { mode: 'grid', icon: Table2, labelKey: 'grid' },
  { mode: 'card', icon: LayoutGrid, labelKey: 'card' },
]

export function ItemListViewToggle({
  value,
  onChange,
  className,
  cardLayout = true,
  gridLayout = true,
  listLabel = 'List view',
  gridLabel = 'Grid view',
  cardLabel = 'Card view',
}: ItemListViewToggleProps) {
  const labels: Record<'list' | 'grid' | 'card', string> = {
    list: listLabel,
    grid: gridLabel,
    card: cardLabel,
  }

  const effectiveValue = resolveCollectionDisplayMode(value, cardLayout, gridLayout)
  const visibleModes = MODES.filter(({ mode }) => {
    if (!cardLayout && mode === 'card') return false
    if (!gridLayout && mode === 'grid') return false
    return true
  })

  return (
    <div
      className={cn('flex shrink-0 items-center gap-1', className)}
      role="group"
      aria-label="Collection display mode"
    >
      {visibleModes.map(({ mode, icon: Icon, labelKey }) => (
        <Button
          key={mode}
          type="button"
          size="icon"
          variant={effectiveValue === mode ? 'default' : 'outline'}
          className="h-9 w-9 shrink-0"
          aria-label={labels[labelKey]}
          aria-pressed={effectiveValue === mode}
          onClick={() => onChange(mode)}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </Button>
      ))}
    </div>
  )
}
