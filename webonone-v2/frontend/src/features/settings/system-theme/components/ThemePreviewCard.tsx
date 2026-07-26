import type { ColorMode } from '@webonone/theme'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@webonone/ui-kit'
import type { ApiTheme } from '../services/themeApi'
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
          values={{
            name: theme.name,
            color1: theme.color1,
            color2: theme.color2,
            color3: theme.color3,
            color4: theme.color4,
            color5: theme.color5,
          }}
          colorMode={colorMode}
          className="min-h-[min(18rem,40vh)]"
        />
      </CardContent>
    </Card>
  )
}
