import { themeDtoToColors } from '@webonone/theme'
import { THEME_COLOR_KEYS, THEME_COLOR_LABELS } from '../constants/defaultThemeFormValues'
import type { ApiTheme } from '../services/themeApi'
import { EditableSectionCard } from './EditableSectionCard'

type ThemePaletteCardProps = {
  theme: ApiTheme
  canEdit?: boolean
  onEdit?: () => void
}

export function ThemePaletteCard({ theme, canEdit, onEdit }: ThemePaletteCardProps) {
  const colors = themeDtoToColors(theme)

  return (
    <EditableSectionCard
      title="Palette"
      description="Five base colors for the platform shell"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <div className="space-y-3">
        {THEME_COLOR_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <span
              className="h-8 w-8 shrink-0 rounded border border-border"
              style={{ backgroundColor: colors[key] }}
              title={colors[key]}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {THEME_COLOR_LABELS[key]}
              </p>
              <p className="font-mono text-sm">{colors[key]}</p>
            </div>
          </div>
        ))}
      </div>
    </EditableSectionCard>
  )
}
