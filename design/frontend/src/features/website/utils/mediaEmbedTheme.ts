import {
  appendThemeToUrl,
  isHexColor,
  parseThemeQueryParams,
  readPersistedTheme,
  relayUiThemeQueryParams,
  type ThemePayload,
} from '@webonone/theme'

/** Media iframe base URL with the user color theme and UI theme already on this page. */
export function withAppliedUserTheme(baseUrl: string): string {
  const search = new URLSearchParams(window.location.search)
  let url = new URL(baseUrl)
  const theme = appliedThemePayload()
  if (theme) {
    url = appendThemeToUrl(url, theme)
  }
  for (const [key, value] of Object.entries(relayUiThemeQueryParams(search))) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

function appliedThemePayload(): ThemePayload | null {
  const fromQuery = parseThemeQueryParams(new URLSearchParams(window.location.search))
  if (fromQuery) return fromQuery
  const persisted = readPersistedTheme()
  if (persisted) return persisted
  return themePayloadFromDocument()
}

function themePayloadFromDocument(): ThemePayload | null {
  const style = getComputedStyle(document.documentElement)
  const colors = [1, 2, 3, 4, 5].map((slot) => {
    const raw = style.getPropertyValue(`--color-${slot}`).trim()
    return raw.startsWith('#') ? raw : `#${raw}`
  })
  if (!colors.every((value) => isHexColor(value))) return null
  return {
    version: 1,
    colorMode: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    theme: {
      id: 'applied-theme',
      name: 'Applied theme',
      color1: colors[0]!,
      color2: colors[1]!,
      color3: colors[2]!,
      color4: colors[3]!,
      color5: colors[4]!,
    },
  }
}
