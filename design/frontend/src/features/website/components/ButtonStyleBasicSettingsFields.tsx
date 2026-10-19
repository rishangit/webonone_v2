import { useTranslation } from 'react-i18next'
import { Form, FormField, Input, ReadOnlyField } from '@webonone/ui-kit'
import { ColorPaletteSwatchStrip } from './ColorPaletteSwatchStrip'
import {
  ThemeColorPaletteSelect,
  type ThemeColorPaletteSelectOption,
} from './theme-editor/ThemeColorPaletteSelect'
import { ThemeTokenSelect, type ThemeTokenOption } from './theme-editor/ThemeTokenSelect'

export type ButtonStyleBasicSettingsValues = {
  name: string
  fontId: string
  colorPaletteId: string
  backgroundColorId: string
  textColorId: string
  borderColorId: string
  textSize: number
  borderWidth: number
  radius: number
}

export type ButtonStyleBasicSettingsOption = ThemeTokenOption
export type ButtonStylePaletteOption = ThemeColorPaletteSelectOption

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
  idPrefix,
  allowNone = false,
  noneLabel,
  fontPlaceholder,
  colorPlaceholder,
}: {
  mode: 'edit' | 'view'
  values: ButtonStyleBasicSettingsValues
  onChange?: (next: ButtonStyleBasicSettingsValues) => void
  fieldErrors?: Partial<Record<string, string>>
  extraError?: string
  fontOptions: ButtonStyleBasicSettingsOption[]
  paletteOptions?: ButtonStylePaletteOption[]
  colorOptions: ButtonStyleBasicSettingsOption[]
  idPrefix: string
  allowNone?: boolean
  noneLabel?: string
  fontPlaceholder?: string
  colorPlaceholder?: string
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const none = noneLabel ?? tc('none')

  function patch(partial: Partial<ButtonStyleBasicSettingsValues>) {
    onChange?.({ ...values, ...partial })
  }

  if (mode === 'view') {
    const fontLabel = fontOptions.find((entry) => entry.id === values.fontId)?.label ?? '—'
    const selectedPalette = paletteOptions.find((entry) => entry.id === values.colorPaletteId)
    return (
      <div className="space-y-4">
        <ReadOnlyField label={t('styleName')} value={values.name} />
        <ReadOnlyField label={t('fontType')} value={fontLabel} />
        {paletteOptions.length > 0 ? (
          <ReadOnlyField
            label={t('buttonColorPalette')}
            value={
              selectedPalette ? (
                <span className="flex min-w-0 items-center gap-2">
                  <ColorPaletteSwatchStrip palette={selectedPalette.palette} sizeClassName="h-5 w-5" />
                  <span className="truncate">{selectedPalette.name}</span>
                </span>
              ) : (
                '—'
              )
            }
          />
        ) : null}
        <ReadOnlyField label={t('backgroundColor')} value={colorReadout(colorOptions, values.backgroundColorId)} />
        <ReadOnlyField label={t('textColor')} value={colorReadout(colorOptions, values.textColorId)} />
        <ReadOnlyField label={t('borderColor')} value={colorReadout(colorOptions, values.borderColorId)} />
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
      {paletteOptions.length > 0 ? (
        <FormField
          label={t('buttonColorPalette')}
          htmlFor={`${idPrefix}-palette`}
          required
          error={fieldErrors.colorPaletteId}
        >
          <ThemeColorPaletteSelect
            id={`${idPrefix}-palette`}
            value={values.colorPaletteId}
            options={paletteOptions}
            placeholder={t('pickColorPaletteRequired')}
            onChange={(colorPaletteId) => patch({ colorPaletteId })}
          />
        </FormField>
      ) : null}
      <FormField
        label={t('backgroundColor')}
        htmlFor={`${idPrefix}-bg`}
        required
        error={fieldErrors.backgroundColorId}
      >
        <ThemeTokenSelect
          id={`${idPrefix}-bg`}
          value={values.backgroundColorId}
          options={colorOptions}
          allowNone={allowNone}
          noneLabel={none}
          placeholder={colorPlaceholder}
          onChange={(backgroundColorId) => patch({ backgroundColorId })}
          aria-required
          aria-invalid={Boolean(fieldErrors.backgroundColorId)}
        />
      </FormField>
      <FormField label={t('textColor')} htmlFor={`${idPrefix}-text`} required error={fieldErrors.textColorId}>
        <ThemeTokenSelect
          id={`${idPrefix}-text`}
          value={values.textColorId}
          options={colorOptions}
          allowNone={allowNone}
          noneLabel={none}
          placeholder={colorPlaceholder}
          onChange={(textColorId) => patch({ textColorId })}
          aria-required
          aria-invalid={Boolean(fieldErrors.textColorId)}
        />
      </FormField>
      <FormField label={t('borderColor')} htmlFor={`${idPrefix}-border`} required error={fieldErrors.borderColorId}>
        <ThemeTokenSelect
          id={`${idPrefix}-border`}
          value={values.borderColorId}
          options={colorOptions}
          allowNone={allowNone}
          noneLabel={none}
          placeholder={colorPlaceholder}
          onChange={(borderColorId) => patch({ borderColorId })}
          aria-required
          aria-invalid={Boolean(fieldErrors.borderColorId)}
        />
      </FormField>
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
