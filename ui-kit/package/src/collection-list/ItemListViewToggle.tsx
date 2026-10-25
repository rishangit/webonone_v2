import { LayoutGrid, List, Table2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from '../components/Button'
import {
  getNextCollectionDisplayMode,
  resolveCollectionDisplayMode,
  type ListDisplayMode,
} from './listDisplayMode'

export interface ItemListViewToggleProps {
  value: ListDisplayMode
  onChange: (mode: ListDisplayMode) => void
  className?: string
  /**
   * When false, card mode is skipped when cycling (collections without entity images).
   * Global preference `card` is shown as list until the user cycles to grid.
   */
  cardLayout?: boolean
  /**
   * When false, grid mode is skipped when cycling (media pickers).
   * Global preference `grid` is shown as list until the user cycles to list or card.
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

  const current = visibleModes.find(({ mode }) => mode === effectiveValue) ?? visibleModes[0]
  if (!current) {
    return null
  }

  const nextMode = getNextCollectionDisplayMode(value, cardLayout, gridLayout)
  const nextEntry = visibleModes.find(({ mode }) => mode === nextMode)
  const CurrentIcon = current.icon
  const nextLabel = nextEntry ? labels[nextEntry.labelKey] : labels[current.labelKey]

  function handleCycle() {
    onChange(nextMode)
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="default"
      className={cn('h-9 w-9 shrink-0', className)}
      aria-label={`${labels[current.labelKey]}. Switch to ${nextLabel}.`}
      onClick={handleCycle}
    >
      <CurrentIcon className="h-4 w-4" aria-hidden />
    </Button>
  )
}
