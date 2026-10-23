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

export type ButtonStyleBasicSettingsValues = {
  name: string
  fontId: string
  /** Style default palette (theme button `colorPaletteId`). Empty inherits theme palette. */
  styleColorPaletteId: string
  backgroundColorPaletteId: string
  backgroundColorId: string
  textColorPaletteId: string
  textColorId: string
  borderColorPaletteId: string
  borderColorId: string
  textSize: number
  borderWidth: number
  radius: number
}

export type ButtonStyleBasicSettingsOption = ThemeTokenOption & { paletteId?: string }
export type ButtonStylePaletteOption = ThemePaletteSelectOption

const COLOR_ROLES: Array<{
  labelKey: 'backgroundColor' | 'textColor' | 'borderColor'
  idSuffix: string
  paletteKey: 'backgroundColorPaletteId' | 'textColorPaletteId' | 'borderColorPaletteId'
  colorKey: 'backgroundColorId' | 'textColorId' | 'borderColorId'
}> = [
  {
    labelKey: 'backgroundColor',
    idSuffix: 'bg',
    paletteKey: 'backgroundColorPaletteId',
    colorKey: 'backgroundColorId',
  },
  {
    labelKey: 'textColor',
    idSuffix: 'text',
    paletteKey: 'textColorPaletteId',
    colorKey: 'textColorId',
  },
  {
    labelKey: 'borderColor',
    idSuffix: 'border',
    paletteKey: 'borderColorPaletteId',
    colorKey: 'borderColorId',
  },
]

function colorReadout(options: ButtonStyleBasicSettingsOption[], id: string) {
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

export function ButtonStyleBasicSettingsFields({
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
  getColorOptionsForPalette,
  onRemapColorForPalette,
}: {
  mode: 'edit' | 'view'
  values: ButtonStyleBasicSettingsValues
  onChange?: (next: ButtonStyleBasicSettingsValues) => void
  fieldErrors?: Partial<Record<string, string>>
  extraError?: string
  fontOptions: ButtonStyleBasicSettingsOption[]
  paletteOptions?: ButtonStylePaletteOption[]
  colorOptions: ButtonStyleBasicSettingsOption[]
  /** Effective palette when style default is empty (theme palette). */
  styleDefaultPaletteId?: string
  idPrefix: string
  allowNone?: boolean
  noneLabel?: string
  /** Top style palette select (theme basic uses common “none”). */
  stylePaletteNoneLabel?: string
  /** Per-color grouped control when palette override is empty. */
  perColorPaletteNoneLabel?: string
  fontPlaceholder?: string
  colorPlaceholder?: string
  getColorOptionsForPalette?: (paletteId: string) => ButtonStyleBasicSettingsOption[]
  onRemapColorForPalette?: (args: {
    fromPaletteId: string
    toPaletteId: string
    colorId: string
  }) => string
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const none = noneLabel ?? tc('none')
  const paletteSelectOptions = toColorPaletteSelectOptions(paletteOptions)
  const hasPaletteList = paletteOptions.length > 0
  const styleEffectivePaletteId = values.styleColorPaletteId.trim() || styleDefaultPaletteId

  function patch(partial: Partial<ButtonStyleBasicSettingsValues>) {
    onChange?.({ ...values, ...partial })
  }

  function optionsForField(storedPaletteId: string) {
    const effective = storedPaletteId.trim() || styleEffectivePaletteId
    if (getColorOptionsForPalette) return getColorOptionsForPalette(effective)
    return colorOptions.filter((entry) => !entry.paletteId || entry.paletteId === effective)
  }

  function effectivePaletteForRole(storedPaletteId: string) {
    return storedPaletteId.trim() || styleEffectivePaletteId
  }

  function onStyleColorPaletteChange(nextPaletteId: string) {
    const previousStyleEffective = styleEffectivePaletteId
    const nextStyleEffective = nextPaletteId.trim() || styleDefaultPaletteId
    const stylePaletteChanged = nextStyleEffective !== previousStyleEffective

    const normalizeRolePalette = (uiPalette: string) => {
      if (!uiPalette.trim() || uiPalette === previousStyleEffective) return ''
      if (stylePaletteChanged && uiPalette === nextStyleEffective) return ''
      return uiPalette
    }

    let nextValues: ButtonStyleBasicSettingsValues = {
      ...values,
      styleColorPaletteId: nextPaletteId,
      backgroundColorPaletteId: normalizeRolePalette(values.backgroundColorPaletteId),
      textColorPaletteId: normalizeRolePalette(values.textColorPaletteId),
      borderColorPaletteId: normalizeRolePalette(values.borderColorPaletteId),
    }

    if (stylePaletteChanged && onRemapColorForPalette) {
      const remap = (colorId: string) =>
        onRemapColorForPalette({
          fromPaletteId: previousStyleEffective,
          toPaletteId: nextStyleEffective,
          colorId,
        })
      if (
        !values.backgroundColorPaletteId.trim() ||
        values.backgroundColorPaletteId === previousStyleEffective
      ) {
        nextValues = { ...nextValues, backgroundColorId: remap(values.backgroundColorId) }
      }
      if (!values.textColorPaletteId.trim() || values.textColorPaletteId === previousStyleEffective) {
        nextValues = { ...nextValues, textColorId: remap(values.textColorId) }
      }
      if (!values.borderColorPaletteId.trim() || values.borderColorPaletteId === previousStyleEffective) {
        nextValues = { ...nextValues, borderColorId: remap(values.borderColorId) }
      }
    }

    onChange?.(nextValues)
  }

  function onRolePaletteChange(
    paletteKey: ButtonStyleBasicSettingsValues['backgroundColorPaletteId'] extends string
      ? 'backgroundColorPaletteId' | 'textColorPaletteId' | 'borderColorPaletteId'
      : never,
    colorKey: 'backgroundColorId' | 'textColorId' | 'borderColorId',
    selectedPaletteId: string,
    nextPaletteId: string,
    colorId: string,
  ) {
    if (nextPaletteId === selectedPaletteId) return
    const previousEffective = effectivePaletteForRole(selectedPaletteId)
    const nextEffective = nextPaletteId.trim() || styleEffectivePaletteId
    const remapped =
      onRemapColorForPalette?.({
        fromPaletteId: previousEffective,
        toPaletteId: nextEffective,
        colorId,
      }) ?? colorId
    patch({
      [paletteKey]: nextPaletteId,
      [colorKey]: remapped,
    })
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
        {COLOR_ROLES.map((role) => (
          <ReadOnlyField
            key={role.colorKey}
            label={t(role.labelKey)}
            value={
              hasPaletteList ? (
                <span className="flex flex-col gap-1">
                  <span>
                    {paletteDisplayName(
                      paletteOptions,
                      values[role.paletteKey],
                      perColorPaletteNoneLabel ?? stylePaletteNoneLabel ?? none,
                    )}
                  </span>
                  <span>
                    {colorReadout(
                      optionsForField(values[role.paletteKey]),
                      values[role.colorKey],
                    )}
                  </span>
                </span>
              ) : (
                colorReadout(optionsForField(values[role.paletteKey]), values[role.colorKey])
              )
            }
          />
        ))}
        <div className="grid grid-cols-3 gap-3">
          <ReadOnlyField label={t('textSize')} value={String(values.textSize)} />
          <ReadOnlyField label={t('borderWidth')} value={String(values.borderWidth)} />
          <ReadOnlyField label={t('radius')} value={String(values.radius)} />
        </div>
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

      {COLOR_ROLES.map((role) => {
        const selectedPaletteId = values[role.paletteKey]
        const fieldOptions = optionsForField(selectedPaletteId)
        const colorId = values[role.colorKey]
        return (
          <FormField
            key={role.colorKey}
            label={t(role.labelKey)}
            htmlFor={`${idPrefix}-${role.idSuffix}-color`}
            error={fieldErrors[role.colorKey] || fieldErrors[role.paletteKey]}
          >
            {hasPaletteList ? (
                <PaletteColorSelect
                  idPrefix={`${idPrefix}-${role.idSuffix}`}
                  paletteId={selectedPaletteId}
                  colorId={colorId}
                  paletteOptions={paletteSelectOptions}
                  colorOptions={fieldOptions}
                  paletteNoneLabel={perColorPaletteNoneLabel ?? stylePaletteNoneLabel}
                  palettePlaceholder={t('pickColorPaletteRequired')}
                  colorNoneLabel={none}
                  colorPlaceholder={colorPlaceholder ?? t('pickColorRequired')}
                  onChange={({ paletteId: nextPaletteId, colorId: nextColorId }) => {
                    if (nextPaletteId !== selectedPaletteId) {
                      onRolePaletteChange(
                        role.paletteKey,
                        role.colorKey,
                        selectedPaletteId,
                        nextPaletteId,
                        colorId,
                      )
                      return
                    }
                    patch({ [role.colorKey]: nextColorId })
                  }}
                  aria-invalid={Boolean(fieldErrors[role.colorKey] || fieldErrors[role.paletteKey])}
                />
            ) : (
                <PaletteColorSelect
                  idPrefix={`${idPrefix}-${role.idSuffix}`}
                  paletteId=""
                  colorId={colorId}
                  paletteOptions={[]}
                  colorOptions={fieldOptions}
                  hidePalette
                  colorNoneLabel={none}
                  colorPlaceholder={colorPlaceholder ?? t('pickColorRequired')}
                  onChange={({ colorId: nextColorId }) => patch({ [role.colorKey]: nextColorId })}
                  aria-invalid={Boolean(fieldErrors[role.colorKey])}
                />
            )}
          </FormField>
        )
      })}

      <div className="grid grid-cols-3 gap-3">
        <FormField label={t('textSize')} htmlFor={`${idPrefix}-size`} error={fieldErrors.textSize}>
          <Input
            id={`${idPrefix}-size`}
            type="number"
            min={8}
            max={200}
            value={values.textSize}
            onChange={(event) => patch({ textSize: Number(event.target.value) || 18 })}
          />
        </FormField>
        <FormField label={t('borderWidth')} htmlFor={`${idPrefix}-border-width`} error={fieldErrors.borderWidth}>
          <Input
            id={`${idPrefix}-border-width`}
            type="number"
            min={0}
            max={16}
            value={values.borderWidth}
            onChange={(event) => patch({ borderWidth: Number(event.target.value) || 0 })}
          />
        </FormField>
        <FormField label={t('radius')} htmlFor={`${idPrefix}-radius`} error={fieldErrors.radius}>
          <Input
            id={`${idPrefix}-radius`}
            type="number"
            min={0}
            max={999}
            value={values.radius}
            onChange={(event) => patch({ radius: Number(event.target.value) || 0 })}
          />
        </FormField>
      </div>
    </Form>
  )
}
