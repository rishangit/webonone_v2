import { useTranslation } from 'react-i18next'
import type { ColorPaletteSelectOption } from '@webonone/ui-kit'
import { ColorPaletteSelect, FormField } from '@webonone/ui-kit'
import type { WebsiteTheme } from '../types'
import { toColorPaletteSelectOptions } from '../utils/colorSelect'
import { themePaletteSelectOptions } from '../utils/websitePalette'

export function useThemePaletteSelectConfig(
  theme: WebsiteTheme | null | undefined,
  inheritedPaletteId?: string | null,
): {
  paletteOptions: ColorPaletteSelectOption[]
  noneLabel: string
  hasPalettes: boolean
} {
  const { t } = useTranslation('website')
  const palettes = theme?.colorPalettes ?? []
  if (!theme || palettes.length === 0) {
    return { paletteOptions: [], noneLabel: t('inheritColorPalette'), hasPalettes: false }
  }
  const inherited = inheritedPaletteId
    ? palettes.find((palette) => palette.id === inheritedPaletteId)
    : palettes.find((palette) => palette.id === theme.colorPaletteId) ?? palettes[0]
  const noneLabel = inherited?.name
    ? t('inheritColorPaletteNamed', { name: inherited.name })
    : t('inheritColorPalette')
  return {
    paletteOptions: toColorPaletteSelectOptions(themePaletteSelectOptions(theme)),
    noneLabel,
    hasPalettes: true,
  }
}

export function ColorPaletteField({
  id,
  theme,
  value,
  inheritedPaletteId = null,
  onChange,
  disabled,
  labelKey = 'colorPalette',
}: {
  id: string
  theme: WebsiteTheme | null | undefined
  value?: string | null
  inheritedPaletteId?: string | null
  onChange: (paletteId: string | null) => void
  disabled?: boolean
  labelKey?: 'colorPalette' | 'elementChildColorPalette'
}) {
  const { t } = useTranslation('website')
  const { paletteOptions, noneLabel, hasPalettes } = useThemePaletteSelectConfig(theme, inheritedPaletteId)
  if (!hasPalettes) return null

  return (
    <FormField label={t(labelKey)} htmlFor={id}>
      <ColorPaletteSelect
        id={id}
        value={value ?? ''}
        options={paletteOptions}
        noneLabel={noneLabel}
        placeholder={noneLabel}
        disabled={disabled}
        onChange={(next) => onChange(next || null)}
      />
    </FormField>
  )
}
