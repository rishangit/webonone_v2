import { cn } from '../lib/utils'
import { inputGroupFocusRingClassName } from './Input'
import { ColorPaletteSelect, type ColorPaletteSelectOption } from './ColorPaletteSelect'
import { ColorSelect, type ColorSelectOption } from './ColorSelect'

export type PaletteColorSelectValue = {
  paletteId: string
  colorId: string
}

export type PaletteColorSelectProps = {
  /** Prefix for sub-control ids (`{idPrefix}-palette`, `{idPrefix}-color`). */
  idPrefix?: string
  paletteId: string
  colorId: string
  paletteOptions: ColorPaletteSelectOption[]
  colorOptions: ColorSelectOption[]
  onChange: (value: PaletteColorSelectValue) => void
  paletteNoneLabel?: string
  colorNoneLabel?: string
  palettePlaceholder?: string
  colorPlaceholder?: string
  disabled?: boolean
  /** When true, only the color dropdown is shown (full width). */
  hidePalette?: boolean
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-describedby'?: string
}

export function PaletteColorSelect({
  idPrefix = 'palette-color',
  paletteId,
  colorId,
  paletteOptions,
  colorOptions,
  onChange,
  paletteNoneLabel,
  colorNoneLabel = 'None',
  palettePlaceholder,
  colorPlaceholder,
  disabled,
  hidePalette = false,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: PaletteColorSelectProps) {
  const invalid = ariaInvalid === true || ariaInvalid === 'true'
  const paletteFieldId = `${idPrefix}-palette`
  const colorFieldId = `${idPrefix}-color`

  function onPaletteChange(nextPaletteId: string) {
    onChange({ paletteId: nextPaletteId, colorId })
  }

  function onColorChange(nextColorId: string) {
    onChange({ paletteId, colorId: nextColorId })
  }

  if (hidePalette) {
    return (
      <div
        className={cn(
          'ui-shape-control flex h-10 w-full items-center overflow-hidden border border-input bg-transparent px-3',
          inputGroupFocusRingClassName,
          invalid && 'border-destructive focus-within:ring-destructive/30',
        )}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy}
      >
        <ColorSelect
          id={colorFieldId}
          inGroup
          value={colorId}
          options={colorOptions}
          noneLabel={colorNoneLabel}
          placeholder={colorPlaceholder}
          disabled={disabled}
          onChange={onColorChange}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'ui-shape-control flex h-10 w-full min-w-0 items-stretch overflow-hidden border border-input bg-transparent',
        inputGroupFocusRingClassName,
        invalid && 'border-destructive focus-within:ring-destructive/30',
      )}
      aria-invalid={invalid || undefined}
      aria-describedby={ariaDescribedBy}
    >
      <div className="flex min-w-0 flex-[1.1] items-stretch border-r border-input px-2">
        <ColorPaletteSelect
          id={paletteFieldId}
          inGroup
          value={paletteId}
          options={paletteOptions}
          noneLabel={paletteNoneLabel}
          placeholder={palettePlaceholder}
          disabled={disabled}
          onChange={onPaletteChange}
        />
      </div>
      <div className="flex min-w-0 flex-1 items-stretch px-2">
        <ColorSelect
          id={colorFieldId}
          inGroup
          value={colorId}
          options={colorOptions}
          noneLabel={colorNoneLabel}
          placeholder={colorPlaceholder}
          disabled={disabled}
          onChange={onColorChange}
          aria-invalid={ariaInvalid}
        />
      </div>
    </div>
  )
}
