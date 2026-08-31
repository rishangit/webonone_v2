import type { ColorMode } from '@webonone/theme'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@webonone/ui-kit'
import type { ApiTheme } from '../services/themeApi'
import { themeFormFromDto } from '../utils/themeFormMapping'
import { ThemePreview } from './ThemePreview'

type ThemePreviewCardProps = {
  theme: ApiTheme
  colorMode: ColorMode
}

export function ThemePreviewCard({ theme, colorMode }: ThemePreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Preview</CardTitle>
        <CardDescription>How this palette looks in the current color mode</CardDescription>
      </CardHeader>
      <CardContent>
        <ThemePreview
          values={themeFormFromDto(theme)}
          colorMode={colorMode}
          className="min-h-[min(28rem,60vh)]"
        />
      </CardContent>
    </Card>
  )
}
