import { Card, Form, FormField, Input } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import {
  applyThemeColorRoles,
  inferThemeColorRoles,
  inferThemePaletteId,
  remapColorIdToPalette,
  themeColorOptionsForPalette,
  themeColorRoleIds,
  themePaletteSelectOptions,
} from '../../utils/websitePalette'
import type { WebsiteThemeColorRoles } from '../../types'
import { ThemeColorPaletteSelect } from './ThemeColorPaletteSelect'
import { ThemeTokenSelect, type ThemeTokenOption } from './ThemeTokenSelect'
import type { ThemeBasicSettingsTabProps } from './types'

const ROLE_FIELDS: Array<{
  key: keyof WebsiteThemeColorRoles
  labelKey: 'pageBackground' | 'surfaceColor' | 'mainTextColor' | 'accentColor1' | 'accentColor2'
  hintKey:
    | 'pageBackgroundHint'
    | 'surfaceColorHint'
    | 'mainTextColorHint'
    | 'accentColor1Hint'
    | 'accentColor2Hint'
}> = [
  { key: 'pageBackgroundColorId', labelKey: 'pageBackground', hintKey: 'pageBackgroundHint' },
  { key: 'surfaceColorId', labelKey: 'surfaceColor', hintKey: 'surfaceColorHint' },
  { key: 'bodyTextColorId', labelKey: 'mainTextColor', hintKey: 'mainTextColorHint' },
  { key: 'accentColor1Id', labelKey: 'accentColor1', hintKey: 'accentColor1Hint' },
  { key: 'accentColor2Id', labelKey: 'accentColor2', hintKey: 'accentColor2Hint' },
]

export function ThemeBasicSettingsTab({ theme, onChange, fieldErrors = {} }: ThemeBasicSettingsTabProps) {
  const { t } = useTranslation('website')
  const roles = inferThemeColorRoles(theme)
  const paletteOptions = themePaletteSelectOptions(theme)
  const colorPaletteId = inferThemePaletteId(theme, themeColorRoleIds(roles))
  const colorOptions: ThemeTokenOption[] = themeColorOptionsForPalette(theme, colorPaletteId)
  const missingTokenLabel = t('themeTokenMissing')
  let colorOptionsWithFallback = colorOptions
  for (const colorId of themeColorRoleIds(roles)) {
    if (colorId && !colorOptionsWithFallback.some((entry) => entry.id === colorId)) {
      colorOptionsWithFallback = [...colorOptionsWithFallback, { id: colorId, label: missingTokenLabel }]
    }
  }

  function patchRoles(nextRoles: WebsiteThemeColorRoles) {
    onChange(applyThemeColorRoles(theme, nextRoles))
  }

  function onPaletteChange(nextPaletteId: string) {
    patchRoles({
      pageBackgroundColorId: remapColorIdToPalette(
        theme,
        colorPaletteId,
        nextPaletteId,
        roles.pageBackgroundColorId,
      ),
      surfaceColorId: remapColorIdToPalette(theme, colorPaletteId, nextPaletteId, roles.surfaceColorId),
      bodyTextColorId: remapColorIdToPalette(theme, colorPaletteId, nextPaletteId, roles.bodyTextColorId),
      accentColor1Id: remapColorIdToPalette(theme, colorPaletteId, nextPaletteId, roles.accentColor1Id),
      accentColor2Id: remapColorIdToPalette(theme, colorPaletteId, nextPaletteId, roles.accentColor2Id),
    })
  }

  return (
    <Card className="space-y-4 p-4">
      <Form className="space-y-4">
        <FormField label={t('name')} htmlFor="theme-name" required error={fieldErrors.name}>
          <Input
            id="theme-name"
            value={theme.name}
            onChange={(event) => onChange({ ...theme, name: event.target.value })}
          />
        </FormField>
        {paletteOptions.length > 0 ? (
          <FormField
            label={t('buttonColorPalette')}
            htmlFor="theme-basic-palette"
            required
            error={fieldErrors.colorPaletteId}
          >
            <ThemeColorPaletteSelect
              id="theme-basic-palette"
              value={colorPaletteId}
              options={paletteOptions}
              placeholder={t('pickColorPaletteRequired')}
              onChange={onPaletteChange}
            />
          </FormField>
        ) : (
          <p className="text-xs text-muted-foreground">{t('themeColorPaletteEmptyHint')}</p>
        )}
        {ROLE_FIELDS.map((field) => (
          <FormField
            key={field.key}
            label={t(field.labelKey)}
            htmlFor={`theme-basic-${field.key}`}
            required={colorOptionsWithFallback.length > 0}
            error={fieldErrors[field.key] ?? fieldErrors[`colorRoles.${field.key}`]}
          >
            <ThemeTokenSelect
              id={`theme-basic-${field.key}`}
              value={roles[field.key]}
              options={colorOptionsWithFallback}
              allowNone={false}
              placeholder={t('pickColorRequired')}
              onChange={(colorId) => patchRoles({ ...roles, [field.key]: colorId })}
              disabled={colorOptionsWithFallback.length === 0}
              aria-required={colorOptionsWithFallback.length > 0}
              aria-invalid={Boolean(fieldErrors[field.key] ?? fieldErrors[`colorRoles.${field.key}`])}
            />
            <p className="mt-1 text-xs text-muted-foreground">{t(field.hintKey)}</p>
          </FormField>
        ))}
      </Form>
    </Card>
  )
}
