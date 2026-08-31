import { ClipboardPaste } from 'lucide-react'
import {
  Button,
  Callout,
  CalloutAction,
  CalloutDescription,
  CalloutTitle,
  ColorInput,
  FormField,
} from '@webonone/ui-kit'
import { THEME_COLOR_KEYS, THEME_COLOR_LABELS } from '../../constants/defaultThemeFormValues'
import type { ThemeFormValues } from '../../schemas/themeFormSchema'

interface ThemeWizardStepPaletteProps {
  values: ThemeFormValues
  fieldErrors: Partial<Record<keyof ThemeFormValues, string>>
  isSubmitting?: boolean
  onChange: (patch: Partial<ThemeFormValues>) => void
  onOpenImport: () => void
}

export function ThemeWizardStepPalette({
  values,
  fieldErrors,
  isSubmitting = false,
  onChange,
  onOpenImport,
}: ThemeWizardStepPaletteProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {THEME_COLOR_KEYS.map((key) => (
          <FormField
            key={key}
            label={THEME_COLOR_LABELS[key]}
            htmlFor={`theme-wizard-${key}`}
            required
            error={fieldErrors[key]}
          >
            <ColorInput
              id={`theme-wizard-${key}`}
              value={values[key]}
              disabled={isSubmitting}
              onChange={(value) => onChange({ [key]: value })}
            />
          </FormField>
        ))}
      </div>

      <Callout>
        <CalloutTitle>Import from CColorPalette</CalloutTitle>
        <CalloutDescription>
          On{' '}
          <a
            href="https://ccolorpalette.com/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            CColorPalette
          </a>
          , choose a palette → <span className="font-medium text-foreground">Export</span> →{' '}
          <span className="font-medium text-foreground">CSS variables</span>, then paste the{' '}
          <code className="rounded bg-background/80 px-1 py-0.5 text-xs">:root {'{ … }'}</code> block
          here to fill all five colors at once.
        </CalloutDescription>
        <CalloutAction>
          <Button type="button" className="h-10" onClick={onOpenImport} disabled={isSubmitting}>
            <ClipboardPaste className="mr-2 h-4 w-4" />
            Paste CSS from CColorPalette
          </Button>
        </CalloutAction>
      </Callout>
    </div>
  )
}
