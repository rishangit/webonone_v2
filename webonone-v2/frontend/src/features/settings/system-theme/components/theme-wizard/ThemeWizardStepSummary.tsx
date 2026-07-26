import type { ColorMode } from '@webonone/theme'
import { THEME_COLOR_LABELS } from '../../constants/defaultThemeFormValues'
import type { ThemeFormValues } from '../../schemas/themeFormSchema'
import { ThemePreview } from '../ThemePreview'

const COLOR_KEYS: Array<
  keyof Pick<ThemeFormValues, 'color1' | 'color2' | 'color3' | 'color4' | 'color5'>
> = ['color1', 'color2', 'color3', 'color4', 'color5']

interface ThemeWizardStepSummaryProps {
  values: ThemeFormValues
  colorMode: ColorMode
  isNew: boolean
}

export function ThemeWizardStepSummary({ values, colorMode, isNew }: ThemeWizardStepSummaryProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isNew
            ? 'Review your theme before creating it.'
            : 'Review your changes before saving.'}
        </p>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Theme name
          </p>
          <p className="text-sm font-medium">{values.name.trim() || '—'}</p>
        </div>
        <div className="space-y-3">
          {COLOR_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span
                className="h-8 w-8 shrink-0 rounded border border-border"
                style={{ backgroundColor: values[key] }}
                title={values[key]}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {THEME_COLOR_LABELS[key]}
                </p>
                <p className="font-mono text-sm">{values[key]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ThemePreview values={values} colorMode={colorMode} />
    </div>
  )
}
