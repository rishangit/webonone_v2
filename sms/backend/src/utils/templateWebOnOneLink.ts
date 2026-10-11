export const SMS_WEBONONE_SUFFIX = ' Open in WebOnOne: {{webOnOneUrl}}'

export function injectSmsWebOnOneLink(body: string): string {
  if (body.includes('{{webOnOneUrl}}')) {
    return body
  }
  return `${body.trimEnd()}${SMS_WEBONONE_SUFFIX}`
}

export function mergeRequiredKey(requiredKeys: unknown, key: string): string[] {
  let keys: string[] = []
  if (Array.isArray(requiredKeys)) {
    keys = requiredKeys.map(String)
  } else if (typeof requiredKeys === 'string') {
    try {
      const parsed = JSON.parse(requiredKeys) as unknown
      if (Array.isArray(parsed)) keys = parsed.map(String)
    } catch {
      keys = []
    }
  }
  if (!keys.includes(key)) {
    keys.push(key)
  }
  return keys
}
