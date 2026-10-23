import {
  ColorPaletteSelect,
  Form,
  FormField,
  Input,
  PaletteColorSelect,
  ReadOnlyField,
} from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import {
  applyThemeChrome,
  normalizePaletteIndex,
  paletteIdAtIndex,
  remapColorIndex,
  themeColorOptionsForPalette,
  themePaletteSelectOptions,
} from '../../utils/websitePalette'
import { toColorPaletteSelectOptions, colorSlotId, colorSlotIndex } from '../../utils/colorSelect'
import { paletteDisplayName } from '../../utils/paletteDisplay'
import type { WebsiteTheme } from '../../types'
import { isWebsiteLibraryCatalog } from '../../utils/websiteCatalogScope'
import { WebsitePublishStatusField } from '../WebsitePublishStatus'

const ROLE_FIELDS: Array<{
  indexKey: 'pageBackgroundIndex' | 'surfaceIndex' | 'bodyTextIndex' | 'accent1Index' | 'accent2Index'
  paletteKey:
    | 'pageBackgroundPaletteIndex'
    | 'surfacePaletteIndex'
    | 'bodyTextPaletteIndex'
    | 'accent1PaletteIndex'
    | 'accent2PaletteIndex'
  labelKey: 'pageBackground' | 'surfaceColor' | 'mainTextColor' | 'accentColor1' | 'accentColor2'
  hintKey:
    | 'pageBackgroundHint'
    | 'surfaceColorHint'
    | 'mainTextColorHint'
    | 'accentColor1Hint'
    | 'accentColor2Hint'
}> = [
  {
    indexKey: 'pageBackgroundIndex',
    paletteKey: 'pageBackgroundPaletteIndex',
    labelKey: 'pageBackground',
    hintKey: 'pageBackgroundHint',
  },
  { indexKey: 'surfaceIndex', paletteKey: 'surfacePaletteIndex', labelKey: 'surfaceColor', hintKey: 'surfaceColorHint' },
  {
    indexKey: 'bodyTextIndex',
    paletteKey: 'bodyTextPaletteIndex',
    labelKey: 'mainTextColor',
    hintKey: 'mainTextColorHint',
  },
  { indexKey: 'accent1Index', paletteKey: 'accent1PaletteIndex', labelKey: 'accentColor1', hintKey: 'accentColor1Hint' },
  { indexKey: 'accent2Index', paletteKey: 'accent2PaletteIndex', labelKey: 'accentColor2', hintKey: 'accentColor2Hint' },
]

function colorReadout(
  options: ReturnType<typeof themeColorOptionsForPalette>,
  colorId: string,
) {
  const color = options.find((entry) => entry.id === colorId)
  if (!color) return '—'
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-4 w-4 shrink-0 rounded-sm border border-[hsl(var(--glass-border))]"
        style={{ backgroundColor: color.swatch }}
        aria-hidden
      />
      {color.label}
    </span>
  )
}

function rolePaletteId(themeValue: WebsiteTheme, paletteIndex: number | null | undefined) {
  const normalized = normalizePaletteIndex(paletteIndex, themeValue.colorPalettes.length)
  return normalized == null ? '' : paletteIdAtIndex(themeValue, normalized)
}

export type ThemeBasicSettingsBodyProps = {
  theme: WebsiteTheme
  onChange: (theme: WebsiteTheme) => void
  fieldErrors: Partial<Record<string, string>>
  mode: 'view' | 'edit'
}

export function ThemeBasicSettingsBody({ theme, onChange, fieldErrors, mode }: ThemeBasicSettingsBodyProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const libraryCatalog = isWebsiteLibraryCatalog()
  const paletteOptions = themePaletteSelectOptions(theme)
  const themePaletteId = theme.colorPaletteId?.trim() || paletteOptions[0]?.id || ''
  const inheritedPaletteName = theme.colorPalettes.find((palette) => palette.id === themePaletteId)?.name
  const paletteNoneLabel = inheritedPaletteName
    ? t('inheritColorPaletteNamed', { name: inheritedPaletteName })
    : t('inheritColorPalette')
  const stylePaletteLabel = paletteDisplayName(paletteOptions, theme.colorPaletteId?.trim() || '', tc('none'))

  function onPaletteChange(nextPaletteId: string) {
    if (!nextPaletteId) {
      onChange(applyThemeChrome({ ...theme, colorPaletteId: '' }))
      return
    }
    const inherited = (index: number | null, paletteIndex: number | null | undefined) =>
      paletteIndex == null ? remapColorIndex(theme, nextPaletteId, index) : index
    onChange(
      applyThemeChrome({
        ...theme,
        colorPaletteId: nextPaletteId,
        pageBackgroundIndex: inherited(theme.pageBackgroundIndex, theme.pageBackgroundPaletteIndex),
        surfaceIndex: inherited(theme.surfaceIndex, theme.surfacePaletteIndex),
        bodyTextIndex: inherited(theme.bodyTextIndex, theme.bodyTextPaletteIndex),
        accent1Index: inherited(theme.accent1Index, theme.accent1PaletteIndex),
        accent2Index: inherited(theme.accent2Index, theme.accent2PaletteIndex),
      }),
    )
  }

  function onRolePaletteChange(field: (typeof ROLE_FIELDS)[number], nextPaletteId: string) {
    if (!nextPaletteId) {
      onChange(
        applyThemeChrome({
          ...theme,
          [field.paletteKey]: null,
          [field.indexKey]: remapColorIndex(theme, themePaletteId, theme[field.indexKey]),
        }),
      )
      return
    }
    const paletteIndex = theme.colorPalettes.findIndex((palette) => palette.id === nextPaletteId) + 1
    onChange(
      applyThemeChrome({
        ...theme,
        [field.paletteKey]: paletteIndex > 0 ? paletteIndex : null,
        [field.indexKey]: remapColorIndex(theme, nextPaletteId, theme[field.indexKey]),
      }),
    )
  }

  if (mode === 'view') {
    return (
      <div className="space-y-4">
        <ReadOnlyField label={t('name')} value={theme.name} />
        {libraryCatalog ? (
          <ReadOnlyField
            label={t('publishStatus')}
            value={theme.publishStatus === 'published' ? t('published') : t('draft')}
          />
        ) : null}
        {paletteOptions.length > 0 ? (
          <ReadOnlyField label={t('buttonColorPalette')} value={stylePaletteLabel} />
        ) : (
          <p className="text-xs text-muted-foreground">{t('themeColorPaletteEmptyHint')}</p>
        )}
        {ROLE_FIELDS.map((field) => {
          const selectedPaletteId = rolePaletteId(theme, theme[field.paletteKey])
          const effectivePaletteId = selectedPaletteId || themePaletteId
          const colorOptions = themeColorOptionsForPalette(theme, effectivePaletteId)
          return (
            <div key={field.indexKey} className="space-y-1">
              <ReadOnlyField
                label={t(field.labelKey)}
                value={
                  paletteOptions.length > 0 ? (
                    <span className="flex flex-col gap-1">
                      <span>
                        {paletteDisplayName(paletteOptions, selectedPaletteId, paletteNoneLabel)}
                      </span>
                      <span>{colorReadout(colorOptions, colorSlotId(theme[field.indexKey]))}</span>
                    </span>
                  ) : (
                    colorReadout(colorOptions, colorSlotId(theme[field.indexKey]))
                  )
                }
              />
              <p className="text-xs text-muted-foreground">{t(field.hintKey)}</p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Form className="space-y-4">
      <FormField label={t('name')} htmlFor="theme-name" required error={fieldErrors.name}>
        <Input
          id="theme-name"
          value={theme.name}
          onChange={(event) => onChange(applyThemeChrome({ ...theme, name: event.target.value }))}
        />
      </FormField>
      {libraryCatalog ? (
        <WebsitePublishStatusField
          id="theme-publish"
          value={theme.publishStatus ?? 'published'}
          onChange={(publishStatus) => onChange(applyThemeChrome({ ...theme, publishStatus }))}
        />
      ) : null}
      {paletteOptions.length > 0 ? (
        <FormField label={t('buttonColorPalette')} htmlFor="theme-basic-palette" error={fieldErrors.colorPaletteId}>
          <ColorPaletteSelect
            id="theme-basic-palette"
            value={theme.colorPaletteId?.trim() || ''}
            options={toColorPaletteSelectOptions(paletteOptions)}
            noneLabel={tc('none')}
            placeholder={t('pickColorPaletteRequired')}
            onChange={onPaletteChange}
          />
        </FormField>
      ) : (
        <p className="text-xs text-muted-foreground">{t('themeColorPaletteEmptyHint')}</p>
      )}
      {ROLE_FIELDS.map((field) => {
        const selectedPaletteId = rolePaletteId(theme, theme[field.paletteKey])
        const effectivePaletteId = selectedPaletteId || themePaletteId
        const colorOptions = themeColorOptionsForPalette(theme, effectivePaletteId)
        return (
          <div key={field.indexKey} className="space-y-1">
            <FormField
              label={t(field.labelKey)}
              htmlFor={`theme-basic-${field.paletteKey}`}
              error={fieldErrors[field.paletteKey] || fieldErrors[field.indexKey]}
            >
              {paletteOptions.length > 0 ? (
                <PaletteColorSelect
                  idPrefix={`theme-basic-${field.indexKey}`}
                  paletteId={selectedPaletteId}
                  colorId={colorSlotId(theme[field.indexKey])}
                  paletteOptions={toColorPaletteSelectOptions(paletteOptions)}
                  colorOptions={colorOptions}
                  paletteNoneLabel={paletteNoneLabel}
                  palettePlaceholder={t('pickColorPaletteRequired')}
                  colorNoneLabel={tc('none')}
                  colorPlaceholder={t('pickColorRequired')}
                  onChange={({ paletteId: nextPaletteId, colorId: nextColorId }) => {
                    if (nextPaletteId !== selectedPaletteId) {
                      onRolePaletteChange(field, nextPaletteId)
                      return
                    }
                    onChange(
                      applyThemeChrome({
                        ...theme,
                        [field.indexKey]: colorSlotIndex(nextColorId),
                      }),
                    )
                  }}
                  aria-invalid={Boolean(fieldErrors[field.paletteKey] || fieldErrors[field.indexKey])}
                />
              ) : (
                <PaletteColorSelect
                  idPrefix={`theme-basic-${field.indexKey}`}
                  paletteId=""
                  colorId={colorSlotId(theme[field.indexKey])}
                  paletteOptions={[]}
                  colorOptions={colorOptions}
                  hidePalette
                  colorNoneLabel={tc('none')}
                  colorPlaceholder={t('pickColorRequired')}
                  onChange={({ colorId: nextColorId }) =>
                    onChange(
                      applyThemeChrome({
                        ...theme,
                        [field.indexKey]: colorSlotIndex(nextColorId),
                      }),
                    )
                  }
                  aria-invalid={Boolean(fieldErrors[field.indexKey])}
                />
              )}
            </FormField>
            <p className="text-xs text-muted-foreground">{t(field.hintKey)}</p>
          </div>
        )
      })}
    </Form>
  )
}
