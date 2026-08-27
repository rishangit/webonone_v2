/** Shared horizontal padding — aligns with AppHeader inner row. */
const shellContentPaddingX = 'px-2 sm:px-6'

/** Page content padding (moved off AppShell main so iframe routes can be full-bleed). */
const shellPagePadding = 'px-2 py-4 sm:px-6 sm:py-6'

/** Impersonation / header notice band reserved height (`text-xs` + `py-1` ≈ 1.5rem). */
const APP_HEADER_NOTICE_OFFSET_CLASS = 'pt-6'

function appShellHeaderTopClass(hasHeaderNotice: boolean): string {
  return hasHeaderNotice ? 'top-20' : 'top-14'
}

function appShellSidebarHeightClass(hasHeaderNotice: boolean): string {
  return hasHeaderNotice ? 'md:h-[calc(100vh-5rem)]' : 'md:h-[calc(100vh-3.5rem)]'
}

export {
  shellContentPaddingX,
  shellPagePadding,
  APP_HEADER_NOTICE_OFFSET_CLASS,
  appShellHeaderTopClass,
  appShellSidebarHeightClass,
}
