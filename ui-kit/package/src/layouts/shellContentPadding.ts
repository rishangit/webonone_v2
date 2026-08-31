/** Shared horizontal padding — aligns with AppHeader inner row. */
const shellContentPaddingX = 'px-2 sm:px-6'

/** Page content padding (moved off AppShell main so iframe routes can be full-bleed). */
const shellPagePadding = 'px-2 py-4 sm:px-6 sm:py-6'

/**
 * Shell chrome outer inset — matches the gap between header, left nav, and main (`gap-2`).
 */
const shellChromeRootClassName = 'gap-2 p-2'

/** Gap between left nav and main content inside the shell body row. */
const shellChromeBodyClassName = 'gap-2'

/** Impersonation / header notice band reserved height (`text-xs` + `py-1` ≈ 1.5rem). */
const APP_HEADER_NOTICE_OFFSET_CLASS = 'pt-6'

export {
  shellContentPaddingX,
  shellPagePadding,
  shellChromeRootClassName,
  shellChromeBodyClassName,
  APP_HEADER_NOTICE_OFFSET_CLASS,
}
