import { EditableSectionCard, ReadOnlyField } from '@webonone/ui-kit'
import type { ApiTheme } from '../services/themeApi'

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
