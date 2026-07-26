import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@webonone/ui-kit'
import type { ApiTheme } from '../services/themeApi'

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

type ThemeMetaCardProps = {
  theme: ApiTheme
  isActive: boolean
}

export function ThemeMetaCard({ theme, isActive }: ThemeMetaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Details</CardTitle>
        <CardDescription>Status and audit information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</p>
          <p className="text-sm">{theme.isSystem ? 'System theme' : 'Custom theme'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="text-sm">{isActive ? 'Active' : 'Inactive'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</p>
          <p className="text-sm">{formatDate(theme.createdAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Updated</p>
          <p className="text-sm">{formatDate(theme.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
