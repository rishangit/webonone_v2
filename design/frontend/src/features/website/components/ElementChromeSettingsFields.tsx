import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@webonone/ui-kit'
import {
  chromeClassName,
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
import { remapColorIndex, themeColorOptionsForPalette } from '../utils/websitePalette'
import { ColorPaletteField } from './ColorPaletteField'
import { ColorSelect, type ColorSelectOption } from '@webonone/ui-kit'

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

  function patch(partial: Partial<ElementChrome>) {
    onChange({ ...value, ...partial })
  }

  function paletteIdFor(explicit: string | null | undefined) {
    return explicit?.trim() || inheritedPaletteId?.trim() || theme?.colorPaletteId || ''
  }

  const paletteId = paletteIdFor(value.colorPaletteId)
  const colorOptions = theme ? themeColorOptionsForPalette(theme, paletteId) : []
  const noneLabel = tc('none')

  function slotFor(index: number | undefined, hex: string | undefined, fromPaletteId: string) {
    const id = chromeColorSlotId(theme, fromPaletteId, index, hex)
    const slot = Number(id)
    return slot >= 1 ? slot : undefined
  }

  function colorFields(
    index: number | undefined,
    hex: string | undefined,
    fromPaletteId: string,
    toPaletteId: string,
  ): { index?: number; hex?: string } {
    if (!theme) return { index, hex }
    const slot = slotFor(index, hex, fromPaletteId)
    if (!slot) return { index: undefined, hex }
    const nextIndex = remapColorIndex(theme, toPaletteId, slot)
    return { index: nextIndex, hex: chromePaletteColor(theme, toPaletteId, nextIndex) }
  }

  function onPaletteChange(nextPaletteId: string | null) {
    const previousId = paletteIdFor(value.colorPaletteId)
    const nextId = paletteIdFor(nextPaletteId)
    const background = colorFields(value.backgroundColorIndex, value.backgroundColor, previousId, nextId)
    const border = colorFields(value.borderColorIndex, value.borderColor, previousId, nextId)
    patch({
      colorPaletteId: nextPaletteId || undefined,
      backgroundColorIndex: background.index,
      backgroundColor: background.hex,
      borderColorIndex: border.index,
      borderColor: border.hex,
    })
  }

  function onThemeColorChange(kind: 'background' | 'border', id: string) {
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

  function colorSelectOptions(slotId: string, hex: string | undefined): ColorSelectOption[] {
    if (slotId && !colorOptions.some((option) => option.id === slotId)) {
      return [...colorOptions, { id: slotId, label: hex || slotId, swatch: hex }]
    }
    if (!slotId && hex) return [...colorOptions, { id: hex, label: hex, swatch: hex }]
    return colorOptions
  }

  const backgroundSlotId = chromeColorSlotId(theme, paletteId, value.backgroundColorIndex, value.backgroundColor)
  const borderSlotId = chromeColorSlotId(theme, paletteId, value.borderColorIndex, value.borderColor)

  useEffect(() => {
    if (!theme) return
    const backgroundIndex = Number(backgroundSlotId)
    const borderIndex = Number(borderSlotId)
    const nextBackgroundIndex = backgroundIndex >= 1 ? backgroundIndex : undefined
    const nextBorderIndex = borderIndex >= 1 ? borderIndex : undefined
    const nextBackground = nextBackgroundIndex
      ? chromePaletteColor(theme, paletteId, nextBackgroundIndex)
      : value.backgroundColor
    const nextBorder = nextBorderIndex ? chromePaletteColor(theme, paletteId, nextBorderIndex) : value.borderColor
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
  }, [backgroundSlotId, borderSlotId, onChange, paletteId, theme, value])

  return (
    <div className="space-y-4">
      <ColorPaletteField
        id={`${idPrefix}-palette`}
        theme={theme}
        value={value.colorPaletteId}
        inheritedPaletteId={inheritedPaletteId}
        onChange={onPaletteChange}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t('background')} htmlFor={`${idPrefix}-bg`} error={fieldErrors.backgroundColor}>
          <ColorSelect
            id={`${idPrefix}-bg`}
            value={backgroundSlotId || value.backgroundColor || ''}
            options={colorSelectOptions(backgroundSlotId, value.backgroundColor)}
            noneLabel={noneLabel}
            placeholder={noneLabel}
            onChange={(id) => onThemeColorChange('background', id)}
          />
        </FormField>
        <FormField label={t('borderColor')} htmlFor={`${idPrefix}-border`} error={fieldErrors.borderColor}>
          <ColorSelect
            id={`${idPrefix}-border`}
            value={borderSlotId || value.borderColor || ''}
            options={colorSelectOptions(borderSlotId, value.borderColor)}
            noneLabel={noneLabel}
            placeholder={noneLabel}
            onChange={(id) => onThemeColorChange('border', id)}
          />
        </FormField>
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
          ...chromeInlineStyle(value, { theme, paletteId }),
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
