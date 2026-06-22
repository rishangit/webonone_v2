import { Button } from '@webonone/ui-kit'
import type { ApiTheme } from '../services/themeApi'

interface ThemeListProps {
  themes: ApiTheme[]
  activeThemeId: string | null
  onSelect: (id: string) => void
  onEdit: (theme: ApiTheme) => void
  onDelete: (id: string) => void
}

export function ThemeList({ themes, activeThemeId, onSelect, onEdit, onDelete }: ThemeListProps) {
  const items = Array.isArray(themes) ? themes : []

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No themes yet.</p>
  }

  return (
    <ul className="space-y-3">
      {items.map((theme) => (
        <li
          key={theme.id}
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">{theme.name}</p>
            <div className="mt-2 flex gap-1">
              {[theme.color1, theme.color2, theme.color3, theme.color4, theme.color5].map((c) => (
                <span
                  key={c}
                  className="h-6 w-6 rounded border border-border"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={activeThemeId === theme.id ? 'secondary' : 'default'}
              onClick={() => onSelect(theme.id)}
            >
              {activeThemeId === theme.id ? 'Active' : 'Apply'}
            </Button>
            {!theme.isSystem ? (
              <>
                <Button type="button" variant="outline" onClick={() => onEdit(theme)}>
                  Edit
                </Button>
                <Button type="button" variant="destructive" onClick={() => onDelete(theme.id)}>
                  Delete
                </Button>
              </>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
