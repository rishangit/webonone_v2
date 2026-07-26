import type { ApiTheme } from '../services/themeApi'
import { EditableSectionCard } from './EditableSectionCard'

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value?.trim() ? value : '—'}</p>
    </div>
  )
}

type ThemeBasicsCardProps = {
  theme: ApiTheme
  canEdit?: boolean
  onEdit?: () => void
}

export function ThemeBasicsCard({ theme, canEdit, onEdit }: ThemeBasicsCardProps) {
  return (
    <EditableSectionCard
      title="Basics"
      description="Theme identity on the platform"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <ReadOnlyField label="Name" value={theme.name} />
    </EditableSectionCard>
  )
}
