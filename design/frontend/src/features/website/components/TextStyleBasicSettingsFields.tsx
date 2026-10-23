import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ColorPaletteSelect,
  Form,
  FormField,
  Input,
  PaletteColorSelect,
  ReadOnlyField,
} from '@webonone/ui-kit'
import { toColorPaletteSelectOptions } from '../utils/colorSelect'
import { paletteDisplayName } from '../utils/paletteDisplay'
import type { ThemePaletteSelectOption } from '../utils/websitePalette'
import { ThemeTokenSelect, type ThemeTokenOption } from './theme-editor/ThemeTokenSelect'

export type TextStyleBasicSettingsValues = {
  name: string
  fontId: string
  styleColorPaletteId: string
  fontColorPaletteId: string
  colorId: string
  size: number
}

export type TextStyleBasicSettingsOption = ThemeTokenOption & { paletteId?: string }
export type TextStylePaletteOption = ThemePaletteSelectOption

function colorReadout(options: TextStyleBasicSettingsOption[], id: string) {
  const color = options.find((entry) => entry.id === id)
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

export function TextStyleBasicSettingsFields({
  mode,
  values,
  onChange,
  fieldErrors = {},
  extraError,
  fontOptions,
  paletteOptions = [],
  colorOptions,
  styleDefaultPaletteId = '',
  idPrefix,
  allowNone = false,
  noneLabel,
  stylePaletteNoneLabel,
  perColorPaletteNoneLabel,
  fontPlaceholder,
  colorPlaceholder,
  showSize = true,
  getColorOptionsForPalette,
  onRemapColorForPalette,
  children,
}: {
  mode: 'edit' | 'view'
  values: TextStyleBasicSettingsValues
  onChange?: (next: TextStyleBasicSettingsValues) => void
  fieldErrors?: Partial<Record<string, string>>
  extraError?: string
  fontOptions: TextStyleBasicSettingsOption[]
  paletteOptions?: TextStylePaletteOption[]
  colorOptions: TextStyleBasicSettingsOption[]
  styleDefaultPaletteId?: string
  idPrefix: string
  allowNone?: boolean
  noneLabel?: string
  stylePaletteNoneLabel?: string
  perColorPaletteNoneLabel?: string
  fontPlaceholder?: string
  colorPlaceholder?: string
  showSize?: boolean
  getColorOptionsForPalette?: (paletteId: string) => TextStyleBasicSettingsOption[]
  onRemapColorForPalette?: (args: {
    fromPaletteId: string
    toPaletteId: string
    colorId: string
  }) => string
  children?: ReactNode
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const none = noneLabel ?? tc('none')
  const paletteSelectOptions = toColorPaletteSelectOptions(paletteOptions)
  const hasPaletteList = paletteOptions.length > 0
  const styleEffectivePaletteId = values.styleColorPaletteId.trim() || styleDefaultPaletteId
  const selectedPaletteId = values.fontColorPaletteId
  const fieldColorOptions = (() => {
    const effective = selectedPaletteId.trim() || styleEffectivePaletteId
    if (getColorOptionsForPalette) return getColorOptionsForPalette(effective)
    return colorOptions.filter((entry) => !entry.paletteId || entry.paletteId === effective)
  })()

  function patch(partial: Partial<TextStyleBasicSettingsValues>) {
    onChange?.({ ...values, ...partial })
  }

  function onStyleColorPaletteChange(nextPaletteId: string) {
    const previousStyleEffective = styleEffectivePaletteId
    const nextStyleEffective = nextPaletteId.trim() || styleDefaultPaletteId
    const stylePaletteChanged = nextStyleEffective !== previousStyleEffective

    let fontColorPaletteId = values.fontColorPaletteId
    if (stylePaletteChanged) {
      if (!fontColorPaletteId.trim() || fontColorPaletteId === previousStyleEffective) {
        fontColorPaletteId = ''
      } else if (fontColorPaletteId === nextStyleEffective) {
        fontColorPaletteId = ''
      }
    }

    let colorId = values.colorId
    if (
      stylePaletteChanged &&
      onRemapColorForPalette &&
      (!values.fontColorPaletteId.trim() || values.fontColorPaletteId === previousStyleEffective)
    ) {
      colorId = onRemapColorForPalette({
        fromPaletteId: previousStyleEffective,
        toPaletteId: nextStyleEffective,
        colorId: values.colorId,
      })
    }

    onChange?.({
      ...values,
      styleColorPaletteId: nextPaletteId,
      fontColorPaletteId,
      colorId,
    })
  }

  function onFontPaletteChange(nextPaletteId: string) {
    if (nextPaletteId === selectedPaletteId) return
    const previousEffective = selectedPaletteId.trim() || styleEffectivePaletteId
    const nextEffective = nextPaletteId.trim() || styleEffectivePaletteId
    const remapped =
      onRemapColorForPalette?.({
        fromPaletteId: previousEffective,
        toPaletteId: nextEffective,
        colorId: values.colorId,
      }) ?? values.colorId
    patch({ fontColorPaletteId: nextPaletteId, colorId: remapped })
  }

  if (mode === 'view') {
    const fontLabel = fontOptions.find((entry) => entry.id === values.fontId)?.label ?? '—'
    const stylePaletteLabel = paletteDisplayName(
      paletteOptions,
      values.styleColorPaletteId,
      stylePaletteNoneLabel ?? none,
    )
    return (
      <div className="space-y-4">
        <ReadOnlyField label={t('styleName')} value={values.name} />
        <ReadOnlyField label={t('fontType')} value={fontLabel} />
        {hasPaletteList ? (
          <ReadOnlyField label={t('buttonColorPalette')} value={stylePaletteLabel} />
        ) : null}
        <ReadOnlyField
          label={t('fontColor')}
          value={
            hasPaletteList ? (
              <span className="flex flex-col gap-1">
                <span>
                  {paletteDisplayName(
                    paletteOptions,
                    selectedPaletteId,
                    perColorPaletteNoneLabel ?? stylePaletteNoneLabel ?? none,
                  )}
                </span>
                <span>{colorReadout(fieldColorOptions, values.colorId)}</span>
              </span>
            ) : (
              colorReadout(fieldColorOptions, values.colorId)
            )
          }
        />
        {showSize ? <ReadOnlyField label={t('sizeLg')} value={String(values.size)} /> : null}
        {children}
      </div>
    )
  }

  return (
    <Form className="space-y-4">
      <FormField label={t('styleName')} htmlFor={`${idPrefix}-name`} required error={fieldErrors.name}>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(event) => patch({ name: event.target.value })}
        />
      </FormField>
      {extraError ? (
        <p className="text-sm text-destructive" role="alert">
          {extraError}
        </p>
      ) : null}
      <FormField label={t('fontType')} htmlFor={`${idPrefix}-font`} required error={fieldErrors.fontId}>
        <ThemeTokenSelect
          id={`${idPrefix}-font`}
          value={values.fontId}
          options={fontOptions}
          allowNone={allowNone}
          noneLabel={none}
          placeholder={fontPlaceholder}
          onChange={(fontId) => patch({ fontId })}
          aria-required
          aria-invalid={Boolean(fieldErrors.fontId)}
        />
      </FormField>

      {hasPaletteList ? (
        <FormField
          label={t('buttonColorPalette')}
          htmlFor={`${idPrefix}-style-palette`}
          error={fieldErrors.colorPaletteId}
        >
          <ColorPaletteSelect
            id={`${idPrefix}-style-palette`}
            value={values.styleColorPaletteId}
            options={paletteSelectOptions}
            noneLabel={stylePaletteNoneLabel ?? tc('none')}
            placeholder={t('pickColorPaletteRequired')}
            onChange={onStyleColorPaletteChange}
          />
        </FormField>
      ) : null}

      <FormField
        label={t('fontColor')}
        htmlFor={`${idPrefix}-font-color`}
        error={fieldErrors.fontColorPaletteId || fieldErrors.colorId}
      >
        {hasPaletteList ? (
          <PaletteColorSelect
            idPrefix={`${idPrefix}-font-color`}
            paletteId={selectedPaletteId}
            colorId={values.colorId}
            paletteOptions={paletteSelectOptions}
            colorOptions={fieldColorOptions}
            paletteNoneLabel={perColorPaletteNoneLabel ?? stylePaletteNoneLabel}
            palettePlaceholder={t('pickColorPaletteRequired')}
            colorNoneLabel={none}
            colorPlaceholder={colorPlaceholder ?? t('pickColorRequired')}
            onChange={({ paletteId: nextPaletteId, colorId: nextColorId }) => {
              if (nextPaletteId !== selectedPaletteId) {
                onFontPaletteChange(nextPaletteId)
                return
              }
              patch({ colorId: nextColorId })
            }}
            aria-invalid={Boolean(fieldErrors.fontColorPaletteId || fieldErrors.colorId)}
          />
        ) : (
          <PaletteColorSelect
            idPrefix={`${idPrefix}-font-color`}
            paletteId=""
            colorId={values.colorId}
            paletteOptions={[]}
            colorOptions={fieldColorOptions}
            hidePalette
            colorNoneLabel={none}
            colorPlaceholder={colorPlaceholder ?? t('pickColorRequired')}
            onChange={({ colorId: nextColorId }) => patch({ colorId: nextColorId })}
            aria-invalid={Boolean(fieldErrors.colorId)}
          />
        )}
      </FormField>

      {showSize ? (
        <FormField label={t('sizeLg')} htmlFor={`${idPrefix}-size`} required error={fieldErrors.size}>
          <Input
            id={`${idPrefix}-size`}
            type="number"
            min={8}
            max={200}
            value={values.size}
            onChange={(event) => patch({ size: Number(event.target.value) || 16 })}
          />
        </FormField>
      ) : null}
      {children}
    </Form>
  )
}
