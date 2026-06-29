export function renderPlaceholders(
  content: string,
  payload: Record<string, string>,
  extras: Record<string, string> = {},
): string {
  const merged = { ...extras, ...payload }
  return content.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => merged[key] ?? '')
}

export function findMissingPlaceholders(
  content: string,
  requiredKeys: string[],
  payload: Record<string, string>,
  extras: Record<string, string> = {},
): string[] {
  const merged = { ...extras, ...payload }
  const missing = new Set<string>()

  for (const key of requiredKeys) {
    if (!merged[key]?.trim()) {
      missing.add(key)
    }
  }

  const referenced = content.match(/\{\{(\w+)\}\}/g) ?? []
  for (const token of referenced) {
    const key = token.slice(2, -2)
    if (!merged[key]?.trim()) {
      missing.add(key)
    }
  }

  return [...missing]
}
