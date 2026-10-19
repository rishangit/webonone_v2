import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, FormField, Input, ReadOnlyField } from '@webonone/ui-kit'
import { ColorPaletteSwatchStrip } from './ColorPaletteSwatchStrip'
import {
  ThemeColorPaletteSelect,
  type ThemeColorPaletteSelectOption,
} from './theme-editor/ThemeColorPaletteSelect'
import { ThemeTokenSelect, type ThemeTokenOption } from './theme-editor/ThemeTokenSelect'

export type TextStyleBasicSettingsValues = {
  name: string
  fontId: string
  colorPaletteId: string
  colorId: string
  size: number
}

export type TextStyleBasicSettingsOption = ThemeTokenOption
export type TextStylePaletteOption = ThemeColorPaletteSelectOption

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
  idPrefix,
  allowNone = false,
  noneLabel,
  fontPlaceholder,
  colorPlaceholder,
  showSize = true,
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
  idPrefix: string
  allowNone?: boolean
  noneLabel?: string
  fontPlaceholder?: string
  colorPlaceholder?: string
  showSize?: boolean
  children?: ReactNode
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const none = noneLabel ?? tc('none')

  function patch(partial: Partial<TextStyleBasicSettingsValues>) {
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
        <ReadOnlyField label={t('fontColor')} value={colorReadout(colorOptions, values.colorId)} />
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
      <FormField label={t('fontColor')} htmlFor={`${idPrefix}-color`} required error={fieldErrors.colorId}>
        <ThemeTokenSelect
          id={`${idPrefix}-color`}
          value={values.colorId}
          options={colorOptions}
          allowNone={allowNone}
          noneLabel={none}
          placeholder={colorPlaceholder}
          onChange={(colorId) => patch({ colorId })}
          aria-required
          aria-invalid={Boolean(fieldErrors.colorId)}
        />
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
