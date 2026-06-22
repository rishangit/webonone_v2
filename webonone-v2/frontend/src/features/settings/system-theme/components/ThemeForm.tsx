import { FormField, Input } from '@webonone/ui-kit'
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
}

export function ThemeForm({ values, onChange, fieldErrors, idPrefix = 'theme' }: ThemeFormProps) {
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

      <div className="grid gap-4 sm:grid-cols-2">
        {COLOR_KEYS.map((key) => {
          const pickerId = `${idPrefix}-${key}-picker`
          const hexId = `${idPrefix}-${key}`

          return (
            <FormField
              key={key}
              label={THEME_COLOR_LABELS[key]}
              htmlFor={hexId}
              required
              error={fieldErrors[key]}
            >
              <div className="flex items-center gap-2">
                <input
                  id={pickerId}
                  type="color"
                  value={values[key]}
                  className="h-10 w-12 cursor-pointer rounded border border-input"
                  onChange={(e) => updateField(key, e.target.value.toUpperCase())}
                />
                <Input
                  id={hexId}
                  value={values[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </div>
            </FormField>
          )
        })}
      </div>
    </div>
  )
}
