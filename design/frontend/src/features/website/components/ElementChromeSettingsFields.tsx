import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  PaletteColorSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  type ColorSelectOption,
} from '@webonone/ui-kit'
import {
  chromeClassName,
  chromeColorPaletteId,
  chromeColorSlotId,
  chromeInlineStyle,
  chromePaletteColor,
  MARGIN_PX,
} from '../document/chrome'
import type {
  ElementBorderRadius,
  ElementBoxShadow,
  ElementChrome,
  ElementMargin,
  ElementPadding,
  WebsiteTheme,
} from '../types'
import { remapColorIndex, stylePaletteId, themeColorOptionsForPalette } from '../utils/websitePalette'
import { ColorPaletteField, useThemePaletteSelectConfig } from './ColorPaletteField'

const NONE = '__none__'

const RADIUS_OPTIONS: ElementBorderRadius[] = ['sm', 'md', 'lg', 'xl', 'full']
const SHADOW_OPTIONS: ElementBoxShadow[] = ['sm', 'md', 'lg']
const PADDING_OPTIONS: ElementPadding[] = [1, 2, 3]
const MARGIN_OPTIONS: ElementMargin[] = [1, 2, 3, 4]

interface ElementChromeSettingsFieldsProps {
  value: ElementChrome
  onChange: (next: ElementChrome) => void
  fieldErrors?: Partial<Record<string, string>>
  idPrefix?: string
  theme?: WebsiteTheme | null
  inheritedPaletteId?: string | null
}

export function ElementChromeSettingsFields({
  value,
  onChange,
  fieldErrors = {},
  idPrefix = 'element-chrome',
  theme = null,
  inheritedPaletteId = null,
}: ElementChromeSettingsFieldsProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { paletteOptions, noneLabel: paletteNoneLabel, hasPalettes } = useThemePaletteSelectConfig(
    theme,
    inheritedPaletteId,
  )

  function patch(partial: Partial<ElementChrome>) {
    onChange({ ...value, ...partial })
  }

  const themePaletteId = theme ? stylePaletteId(theme, null) : ''
  const noneLabel = tc('none')

  function storedPaletteUi(stored: string | null | undefined): string {
    const trimmed = stored?.trim() || ''
    if (!trimmed || trimmed === themePaletteId) return ''
    return trimmed
  }

  function effectivePaletteForKind(kind: 'background' | 'border'): string {
    if (!theme) return ''
    const inherited = inheritedPaletteId?.trim() || themePaletteId
    return chromeColorPaletteId(value, kind, inherited) ?? inherited
  }

  function slotFor(
    kind: 'background' | 'border',
    index: number | undefined,
    hex: string | undefined,
  ) {
    const paletteId = effectivePaletteForKind(kind)
    const id = chromeColorSlotId(theme, paletteId, index, hex)
    const slot = Number(id)
    return slot >= 1 ? slot : undefined
  }

  function colorFields(
    kind: 'background' | 'border',
    index: number | undefined,
    hex: string | undefined,
    toPaletteId: string,
  ): { index?: number; hex?: string } {
    if (!theme) return { index, hex }
    const slot = slotFor(kind, index, hex)
    if (!slot) return { index: undefined, hex }
    const nextIndex = remapColorIndex(theme, toPaletteId, slot)
    return { index: nextIndex, hex: chromePaletteColor(theme, toPaletteId, nextIndex) }
  }

  function onPerColorPaletteChange(kind: 'background' | 'border', nextPaletteUi: string) {
    const paletteKey = kind === 'background' ? 'backgroundColorPaletteId' : 'borderColorPaletteId'
    const nextStored = nextPaletteUi.trim() || null
    const nextEffective =
      nextStored ||
      value.colorPaletteId?.trim() ||
      inheritedPaletteId?.trim() ||
      themePaletteId
    const background =
      kind === 'background'
        ? colorFields('background', value.backgroundColorIndex, value.backgroundColor, nextEffective)
        : { index: value.backgroundColorIndex, hex: value.backgroundColor }
    const border =
      kind === 'border'
        ? colorFields('border', value.borderColorIndex, value.borderColor, nextEffective)
        : { index: value.borderColorIndex, hex: value.borderColor }
    patch({
      [paletteKey]: nextStored === null ? undefined : nextStored,
      backgroundColorIndex: background.index,
      backgroundColor: background.hex,
      borderColorIndex: border.index,
      borderColor: border.hex,
    })
  }

  function onThemeColorChange(kind: 'background' | 'border', id: string) {
    const paletteId = effectivePaletteForKind(kind)
    const index = Number(id)
    if (!theme || !Number.isInteger(index) || index < 1) {
      patch(
        kind === 'background'
          ? { backgroundColorIndex: undefined, backgroundColor: undefined }
          : { borderColorIndex: undefined, borderColor: undefined },
      )
      return
    }
    const hex = chromePaletteColor(theme, paletteId, index)
    patch(
      kind === 'background'
        ? { backgroundColorIndex: index, backgroundColor: hex }
        : { borderColorIndex: index, borderColor: hex },
    )
  }

  function colorSelectOptions(paletteId: string, slotId: string, hex: string | undefined): ColorSelectOption[] {
    const colorOptions = theme ? themeColorOptionsForPalette(theme, paletteId) : []
    if (slotId && !colorOptions.some((option) => option.id === slotId)) {
      return [...colorOptions, { id: slotId, label: hex || slotId, swatch: hex }]
    }
    if (!slotId && hex) return [...colorOptions, { id: hex, label: hex, swatch: hex }]
    return colorOptions
  }

  const backgroundPaletteUi = storedPaletteUi(value.backgroundColorPaletteId)
  const borderPaletteUi = storedPaletteUi(value.borderColorPaletteId)
  const backgroundEffective = effectivePaletteForKind('background')
  const borderEffective = effectivePaletteForKind('border')
  const backgroundSlotId = chromeColorSlotId(
    theme,
    backgroundEffective,
    value.backgroundColorIndex,
    value.backgroundColor,
  )
  const borderSlotId = chromeColorSlotId(theme, borderEffective, value.borderColorIndex, value.borderColor)

  useEffect(() => {
    if (!theme) return
    const backgroundIndex = Number(backgroundSlotId)
    const borderIndex = Number(borderSlotId)
    const nextBackgroundIndex = backgroundIndex >= 1 ? backgroundIndex : undefined
    const nextBorderIndex = borderIndex >= 1 ? borderIndex : undefined
    const nextBackground = nextBackgroundIndex
      ? chromePaletteColor(theme, backgroundEffective, nextBackgroundIndex)
      : value.backgroundColor
    const nextBorder = nextBorderIndex
      ? chromePaletteColor(theme, borderEffective, nextBorderIndex)
      : value.borderColor
    if (
      nextBackgroundIndex === value.backgroundColorIndex &&
      nextBorderIndex === value.borderColorIndex &&
      nextBackground === value.backgroundColor &&
      nextBorder === value.borderColor
    ) {
      return
    }
    onChange({
      ...value,
      backgroundColorIndex: nextBackgroundIndex,
      backgroundColor: nextBackground,
      borderColorIndex: nextBorderIndex,
      borderColor: nextBorder,
    })
  }, [
    backgroundEffective,
    backgroundSlotId,
    borderEffective,
    borderSlotId,
    onChange,
    theme,
    value,
  ])

  function renderChromeColorField(
    label: string,
    idSuffix: string,
    storedPaletteUiValue: string,
    effectivePaletteId: string,
    slotId: string,
    hex: string | undefined,
    kind: 'background' | 'border',
    error?: string,
  ) {
    const colorId = slotId || hex || ''
    const options = colorSelectOptions(effectivePaletteId, slotId, hex)
    const htmlFor = `${idPrefix}-${idSuffix}`

    if (hasPalettes) {
      return (
        <FormField label={label} htmlFor={htmlFor} error={error}>
          <PaletteColorSelect
            idPrefix={`${idPrefix}-${idSuffix}`}
            paletteId={storedPaletteUiValue}
            colorId={colorId}
            paletteOptions={paletteOptions}
            colorOptions={options}
            paletteNoneLabel={paletteNoneLabel}
            palettePlaceholder={paletteNoneLabel}
            colorNoneLabel={noneLabel}
            colorPlaceholder={noneLabel}
            onChange={({ paletteId: nextPaletteId, colorId: nextColorId }) => {
              if ((nextPaletteId || '') !== storedPaletteUiValue) {
                onPerColorPaletteChange(kind, nextPaletteId || '')
                return
              }
              onThemeColorChange(kind, nextColorId)
            }}
            aria-invalid={Boolean(error)}
          />
        </FormField>
      )
    }

    return (
      <FormField label={label} htmlFor={htmlFor} error={error}>
        <PaletteColorSelect
          idPrefix={`${idPrefix}-${idSuffix}`}
          paletteId=""
          colorId={colorId}
          paletteOptions={[]}
          colorOptions={options}
          hidePalette
          colorNoneLabel={noneLabel}
          colorPlaceholder={noneLabel}
          onChange={({ colorId: nextColorId }) => onThemeColorChange(kind, nextColorId)}
          aria-invalid={Boolean(error)}
        />
      </FormField>
    )
  }

  return (
    <div className="space-y-4">
      <ColorPaletteField
        id={`${idPrefix}-inherit-palette`}
        theme={theme}
        value={value.colorPaletteId}
        inheritedPaletteId={inheritedPaletteId}
        labelKey="elementChildColorPalette"
        onChange={(paletteId) => patch({ colorPaletteId: paletteId ?? undefined })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {renderChromeColorField(
          t('background'),
          'bg',
          backgroundPaletteUi,
          backgroundEffective,
          backgroundSlotId,
          value.backgroundColor,
          'background',
          fieldErrors.backgroundColor,
        )}
        {renderChromeColorField(
          t('borderColor'),
          'border',
          borderPaletteUi,
          borderEffective,
          borderSlotId,
          value.borderColor,
          'border',
          fieldErrors.borderColor,
        )}
        <FormField label={t('borderRadius')} htmlFor={`${idPrefix}-radius`} error={fieldErrors.borderRadius}>
          <Select
            value={value.borderRadius ?? NONE}
            onValueChange={(next) =>
              patch({ borderRadius: next === NONE ? undefined : (next as ElementBorderRadius) })
            }
          >
            <SelectTrigger id={`${idPrefix}-radius`}>
              <SelectValue placeholder={t('spacingNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t('spacingNone')}</SelectItem>
              {RADIUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`chromeRadius.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('boxShadow')} htmlFor={`${idPrefix}-shadow`} error={fieldErrors.boxShadow}>
          <Select
            value={value.boxShadow ?? NONE}
            onValueChange={(next) =>
              patch({ boxShadow: next === NONE ? undefined : (next as ElementBoxShadow) })
            }
          >
            <SelectTrigger id={`${idPrefix}-shadow`}>
              <SelectValue placeholder={t('spacingNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t('spacingNone')}</SelectItem>
              {SHADOW_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`chromeShadow.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('padding')} htmlFor={`${idPrefix}-padding`} error={fieldErrors.padding}>
          <Select
            value={value.padding != null ? String(value.padding) : NONE}
            onValueChange={(next) =>
              patch({ padding: next === NONE ? undefined : (Number(next) as ElementPadding) })
            }
          >
            <SelectTrigger id={`${idPrefix}-padding`}>
              <SelectValue placeholder={t('spacingNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t('spacingNone')}</SelectItem>
              {PADDING_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('margin')} htmlFor={`${idPrefix}-margin`} error={fieldErrors.margin}>
          <Select
            value={value.margin != null ? String(value.margin) : NONE}
            onValueChange={(next) =>
              patch({ margin: next === NONE ? undefined : (Number(next) as ElementMargin) })
            }
          >
            <SelectTrigger id={`${idPrefix}-margin`}>
              <SelectValue placeholder={t('spacingNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t('spacingNone')}</SelectItem>
              {MARGIN_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <div
        className={cn(
          'w-full border border-dashed border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4',
          chromeClassName({
            borderRadius: value.borderRadius,
            boxShadow: value.boxShadow,
            padding: value.padding,
          }),
        )}
        style={{
          ...chromeInlineStyle(value, { theme, paletteId: inheritedPaletteId }),
          ...(value.margin != null
            ? { margin: MARGIN_PX[value.margin], width: `calc(100% - ${2 * MARGIN_PX[value.margin]}px)` }
            : undefined),
        }}
      >
        <p className="text-sm text-muted-foreground">{t('colorPreview')}</p>
      </div>
    </div>
  )
}
