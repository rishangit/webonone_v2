import { useTranslation } from 'react-i18next'
import { ColorPaletteSelect, FormField } from '@webonone/ui-kit'
import type { WebsiteTheme } from '../types'
import { toColorPaletteSelectOptions } from '../utils/colorSelect'
import { themePaletteSelectOptions } from '../utils/websitePalette'

export function ColorPaletteField({
  id,
  theme,
  value,
  inheritedPaletteId = null,
  onChange,
  disabled,
}: {
  id: string
  theme: WebsiteTheme | null | undefined
  value?: string | null
  inheritedPaletteId?: string | null
  onChange: (paletteId: string | null) => void
  disabled?: boolean
}) {
  const { t } = useTranslation('website')
  const palettes = theme?.colorPalettes ?? []
  if (!theme || palettes.length === 0) return null
  const inherited = inheritedPaletteId
    ? palettes.find((palette) => palette.id === inheritedPaletteId)
    : palettes.find((palette) => palette.id === theme.colorPaletteId) ?? palettes[0]
  const noneLabel = inherited?.name
    ? t('inheritColorPaletteNamed', { name: inherited.name })
    : t('inheritColorPalette')

  return (
    <FormField label={t('colorPalette')} htmlFor={id}>
      <ColorPaletteSelect
        id={id}
        value={value ?? ''}
        options={toColorPaletteSelectOptions(themePaletteSelectOptions(theme))}
        noneLabel={noneLabel}
        placeholder={noneLabel}
        disabled={disabled}
        onChange={(next) => onChange(next || null)}
      />
    </FormField>
  )
}
