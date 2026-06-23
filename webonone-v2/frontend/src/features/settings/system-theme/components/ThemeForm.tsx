import { ColorInput, FormField, Input } from '@webonone/ui-kit'
import { THEME_COLOR_LABELS } from '../constants/defaultThemeFormValues'
import type { ThemeFormValues } from '../schemas/themeFormSchema'

const COLOR_KEYS: Array<keyof Pick<ThemeFormValues, 'color1' | 'color2' | 'color3' | 'color4' | 'color5'>> = [
  'color1',
  'color2',
  'color3',
  'color4',
  'color5',
]

interface ThemeFormProps {
  values: ThemeFormValues
  onChange: (values: ThemeFormValues) => void
  fieldErrors: Partial<Record<keyof ThemeFormValues, string>>
  idPrefix?: string
  colorColumns?: 1 | 2
}

export function ThemeForm({
  values,
  onChange,
  fieldErrors,
  idPrefix = 'theme',
  colorColumns = 2,
}: ThemeFormProps) {
  function updateField<K extends keyof ThemeFormValues>(key: K, value: ThemeFormValues[K]) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="space-y-4">
      <FormField
        label="Theme name"
        htmlFor={`${idPrefix}-name`}
        required
        error={fieldErrors.name}
      >
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(e) => updateField('name', e.target.value)}
        />
      </FormField>

      <div className={colorColumns === 1 ? 'grid gap-4 grid-cols-1' : 'grid gap-4 sm:grid-cols-2'}>
        {COLOR_KEYS.map((key) => (
          <FormField
            key={key}
            label={THEME_COLOR_LABELS[key]}
            htmlFor={`${idPrefix}-${key}`}
            required
            error={fieldErrors[key]}
          >
            <ColorInput
              id={`${idPrefix}-${key}`}
              value={values[key]}
              onChange={(value) => updateField(key, value)}
            />
          </FormField>
        ))}
      </div>
    </div>
  )
}
