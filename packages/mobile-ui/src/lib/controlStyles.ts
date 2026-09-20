import { Platform, type TextInputProps, type TextProps } from 'react-native'
import { cn } from './cn'

/**
 * Native control height — taller than desktop web `h-10` so it matches web *on
 * a phone*: touch inputs use 16px type (`1rem`) and need a 48px tap target.
 */
export const CONTROL_HEIGHT_CLASS = 'h-12'
export const CONTROL_HEIGHT_PX = 48

/** Compact controls (sm buttons, header search) — 44px iOS minimum tap target. */
export const CONTROL_HEIGHT_SM_CLASS = 'h-11'
export const CONTROL_HEIGHT_SM_PX = 44

/** Native TextInput props that keep single-line text vertically centered in pill fields. */
export function controlTextInputProps(multiline = false): TextInputProps {
  return {
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
    textAlignVertical: multiline ? 'top' : 'center',
  } as TextInputProps
}

/** Control copy — matches web mobile touch (`font-size: 1rem`). */
export const controlLabelClassName = 'text-base font-medium leading-none'

/** Inner text in grouped fields — 16px like web mobile inputs. */
export const controlInGroupFieldClassName =
  'min-h-0 min-w-0 flex-1 py-0 text-base leading-6 text-foreground'

/** Read-only value in closed select / picker triggers — tight line height for vertical centering. */
export const controlTriggerValueClassName = 'text-base leading-none text-foreground'

/** Props for single-line display text inside fixed-height controls (select trigger, menu rows). */
export function controlDisplayTextProps(): Pick<TextProps, 'style'> {
  return Platform.OS === 'android'
    ? { style: { lineHeight: 20, includeFontPadding: false } }
    : {}
}

/** Pill-shaped single-line controls. */
export const controlFieldClassName = cn(
  CONTROL_HEIGHT_CLASS,
  'rounded-control border border-input-border bg-transparent px-4 py-0 text-base leading-6 text-foreground',
)

export const controlFieldInvalidClassName = 'border-destructive'

/** Multiline controls. */
export const controlSurfaceClassName =
  'min-h-[112px] rounded-md border border-input-border bg-transparent px-4 py-3 text-base text-foreground'

/** Group shell for search and composite inputs. */
export const controlGroupClassName = cn(
  CONTROL_HEIGHT_CLASS,
  'flex-row items-center gap-2 overflow-hidden rounded-control border border-input-border bg-transparent px-4',
)

/** Compact header search field. */
export const controlGroupCompactClassName = cn(
  CONTROL_HEIGHT_SM_CLASS,
  'w-full min-w-0 flex-row items-center overflow-hidden rounded-control border border-input-border bg-transparent',
)

/** Closed select / native picker trigger. */
export const controlTriggerClassName = cn(
  CONTROL_HEIGHT_CLASS,
  'flex-row items-center justify-between rounded-control border border-input-border bg-transparent px-4',
)

/**
 * User / tag / media pickers — no fixed height so two-line selected content
 * is not clipped; padding matches the taller native control.
 */
export const controlPickerTriggerClassName =
  'flex-row items-center gap-3 rounded-control border border-input-border bg-transparent px-4 py-3'

export function controlFieldClass(error?: string | null, className?: string) {
  return cn(controlFieldClassName, error ? controlFieldInvalidClassName : undefined, className)
}
