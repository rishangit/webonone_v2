import { Card, ColorInput, FormField, Input } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import type { ThemeEditorTabProps } from './types'

export function ThemeBasicSettingsTab({ theme, onChange, fieldErrors = {} }: ThemeEditorTabProps) {
  const { t } = useTranslation('website')

  return (
    <Card className="space-y-4 p-4">
      <FormField label={t('name')} htmlFor="theme-name" required error={fieldErrors.name}>
        <Input
          id="theme-name"
          value={theme.name}
          onChange={(event) => onChange({ ...theme, name: event.target.value })}
        />
      </FormField>
      <FormField
        label={t('pageBackground')}
        htmlFor="theme-page-bg"
        error={fieldErrors.pageBackground}
      >
        <ColorInput
          id="theme-page-bg"
          value={theme.pageBackground}
          onChange={(value) => onChange({ ...theme, pageBackground: value })}
        />
      </FormField>
      <FormField label={t('bodyTextColor')} htmlFor="theme-body" error={fieldErrors.bodyTextColor}>
        <ColorInput
          id="theme-body"
          value={theme.bodyTextColor}
          onChange={(value) => onChange({ ...theme, bodyTextColor: value })}
        />
      </FormField>
    </Card>
  )
}
