/** Injected at build time from `frontend/package.json` via Vite `define`. */
export function getWebOnOneAppVersionLabel(): string {
  const raw = __WEBONONE_APP_VERSION__
  const trimmed = raw.trim()
  if (!trimmed) return 'v0.0.0'
  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`
}
