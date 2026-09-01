/** Full-viewport scrim layer — sibling of app-shell-body, below the header (z-50). */
const SHELL_OVERLAY_ROOT_ID = 'shell-overlay-root'

/** Right slide panels mount here — same DOM row as AppSidebar inside app-shell-body. */
const SHELL_SLIDE_HOST_ID = 'shell-slide-host'

function getShellOverlayRoot(): HTMLElement {
  return document.getElementById(SHELL_OVERLAY_ROOT_ID) ?? document.body
}

function getShellSlideHost(): HTMLElement {
  return document.getElementById(SHELL_SLIDE_HOST_ID) ?? getShellOverlayRoot()
}

export { SHELL_OVERLAY_ROOT_ID, SHELL_SLIDE_HOST_ID, getShellOverlayRoot, getShellSlideHost }
