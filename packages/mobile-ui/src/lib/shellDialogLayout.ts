export type DialogSizePreset = 'small' | 'medium' | 'large' | 'xlarge' | 'auto'

/** Horizontal inset — matches ui-kit `shellDialogOverlayClassName` (`px-2`). */
export const SHELL_DIALOG_PADDING_X = 8

/** Same breakpoint as Tailwind `sm` in ui-kit `CustomDialog` width classes. */
export const SHELL_DIALOG_SM_BREAKPOINT = 640

/** `max-w-lg` cap for `sizeWidth="auto"` on wider viewports. */
export const SHELL_DIALOG_AUTO_MAX_WIDTH = 512

const WIDTH_FRACTION: Record<Exclude<DialogSizePreset, 'auto'>, number> = {
  small: 0.5,
  medium: 2 / 3,
  large: 0.75,
  xlarge: 5 / 6,
}

/**
 * Panel width aligned with web `@webonone/ui-kit` `CustomDialog`:
 * below `sm`, `w-full` inside `px-2` overlay; at `sm+`, fractional widths.
 */
export function resolveDialogPanelWidth(windowWidth: number, sizeWidth: DialogSizePreset): number {
  const available = windowWidth - SHELL_DIALOG_PADDING_X * 2
  if (windowWidth < SHELL_DIALOG_SM_BREAKPOINT) {
    return available
  }
  if (sizeWidth === 'auto') {
    return Math.min(available, SHELL_DIALOG_AUTO_MAX_WIDTH)
  }
  return Math.round(available * WIDTH_FRACTION[sizeWidth])
}
