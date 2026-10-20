import { Card, Form, FormField, Input } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import {
  applyThemeChrome,
  remapColorIndex,
  themeColorOptionsForPalette,
  themePaletteSelectOptions,
} from '../../utils/websitePalette'
import { ThemeColorPaletteSelect } from './ThemeColorPaletteSelect'
import { ThemeTokenSelect, type ThemeTokenOption } from './ThemeTokenSelect'
import type { ThemeBasicSettingsTabProps } from './types'

const ROLE_FIELDS: Array<{
  key: 'pageBackgroundIndex' | 'surfaceIndex' | 'bodyTextIndex' | 'accent1Index' | 'accent2Index'
  labelKey: 'pageBackground' | 'surfaceColor' | 'mainTextColor' | 'accentColor1' | 'accentColor2'
  hintKey:
    | 'pageBackgroundHint'
    | 'surfaceColorHint'
    | 'mainTextColorHint'
    | 'accentColor1Hint'
    | 'accentColor2Hint'
}> = [
  { key: 'pageBackgroundIndex', labelKey: 'pageBackground', hintKey: 'pageBackgroundHint' },
  { key: 'surfaceIndex', labelKey: 'surfaceColor', hintKey: 'surfaceColorHint' },
  { key: 'bodyTextIndex', labelKey: 'mainTextColor', hintKey: 'mainTextColorHint' },
  { key: 'accent1Index', labelKey: 'accentColor1', hintKey: 'accentColor1Hint' },
  { key: 'accent2Index', labelKey: 'accentColor2', hintKey: 'accentColor2Hint' },
]

export function ThemeBasicSettingsTab({ theme, onChange, fieldErrors = {} }: ThemeBasicSettingsTabProps) {
  const { t } = useTranslation('website')
  const paletteOptions = themePaletteSelectOptions(theme)
  const colorPaletteId = theme.colorPaletteId || paletteOptions[0]?.id || ''
  const colorOptions: ThemeTokenOption[] = themeColorOptionsForPalette(theme, colorPaletteId)

  function onPaletteChange(nextPaletteId: string) {
    onChange(
      applyThemeChrome({
        ...theme,
        colorPaletteId: nextPaletteId,
        pageBackgroundIndex: remapColorIndex(theme, nextPaletteId, theme.pageBackgroundIndex),
        surfaceIndex: remapColorIndex(theme, nextPaletteId, theme.surfaceIndex),
        bodyTextIndex: remapColorIndex(theme, nextPaletteId, theme.bodyTextIndex),
        accent1Index: remapColorIndex(theme, nextPaletteId, theme.accent1Index),
        accent2Index: remapColorIndex(theme, nextPaletteId, theme.accent2Index),
      }),
    )
  }

  return (
    <Card className="space-y-4 p-4">
      <Form className="space-y-4">
        <FormField label={t('name')} htmlFor="theme-name" required error={fieldErrors.name}>
          <Input
            id="theme-name"
            value={theme.name}
            onChange={(event) => onChange(applyThemeChrome({ ...theme, name: event.target.value }))}
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
            required={colorOptions.length > 0}
            error={fieldErrors[field.key]}
          >
            <ThemeTokenSelect
              id={`theme-basic-${field.key}`}
              value={String(theme[field.key] || '')}
              options={colorOptions}
              allowNone={false}
              placeholder={t('pickColorRequired')}
              onChange={(colorIndex) =>
                onChange(applyThemeChrome({ ...theme, colorPaletteId, [field.key]: Number(colorIndex) || 1 }))
              }
              disabled={colorOptions.length === 0}
              aria-required={colorOptions.length > 0}
              aria-invalid={Boolean(fieldErrors[field.key])}
            />
            <p className="mt-1 text-xs text-muted-foreground">{t(field.hintKey)}</p>
          </FormField>
        ))}
      </Form>
    </Card>
  )
}
