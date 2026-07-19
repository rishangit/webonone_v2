export function getWebOnOneOrigin(): string {
  return import.meta.env.VITE_WEBONONE_ORIGIN ?? 'http://localhost:3010'
}

export function parseAllowedParentOrigins(): string[] {
  const raw =
    import.meta.env.VITE_ALLOWED_PARENT_ORIGINS ??
    `${getWebOnOneOrigin()},http://127.0.0.1:3010,http://localhost:3011,http://127.0.0.1:3011,http://localhost:3012,http://127.0.0.1:3012`
  return raw
    .split(',')
    .map((entry: string) => entry.trim())
    .filter(Boolean)
}

export function isAllowedParentOrigin(origin: string): boolean {
  return parseAllowedParentOrigins().includes(origin)
}
