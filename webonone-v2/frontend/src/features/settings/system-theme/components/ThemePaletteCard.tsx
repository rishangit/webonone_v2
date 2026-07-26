import { THEME_COLOR_LABELS } from '../constants/defaultThemeFormValues'
import type { ApiTheme } from '../services/themeApi'
import { EditableSectionCard } from './EditableSectionCard'

const COLOR_KEYS = ['color1', 'color2', 'color3', 'color4', 'color5'] as const

type ThemePaletteCardProps = {
  theme: ApiTheme
  canEdit?: boolean
  onEdit?: () => void
}

export function ThemePaletteCard({ theme, canEdit, onEdit }: ThemePaletteCardProps) {
  return (
    <EditableSectionCard
      title="Palette"
      description="Five accent colors for the platform shell"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <div className="space-y-3">
        {COLOR_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <span
              className="h-8 w-8 shrink-0 rounded border border-border"
              style={{ backgroundColor: theme[key] }}
              title={theme[key]}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {THEME_COLOR_LABELS[key]}
              </p>
              <p className="font-mono text-sm">{theme[key]}</p>
            </div>
          </div>
        ))}
      </div>
    </EditableSectionCard>
  )
}
