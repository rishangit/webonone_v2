export function renderPlaceholders(
  content: string,
  payload: Record<string, string>,
  extras: Record<string, string> = {},
): string {
  const merged = { ...extras, ...payload }
  return content.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => merged[key] ?? '')
}

export function findMissingPlaceholders(
  _content: string,
  requiredKeys: string[],
  payload: Record<string, string>,
  extras: Record<string, string> = {},
): string[] {
  const merged = { ...extras, ...payload }
  const missing: string[] = []

  for (const key of requiredKeys) {
    if (!merged[key]?.trim()) {
      missing.push(key)
    }
  }

  return missing
}
