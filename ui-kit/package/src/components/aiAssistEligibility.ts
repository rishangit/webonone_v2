const SKIP_TYPES = new Set([
  'password',
  'email',
  'tel',
  'url',
  'number',
  'search',
  'hidden',
  'file',
  'date',
  'color',
  'range',
  'checkbox',
  'radio',
  'datetime-local',
  'month',
  'week',
  'time',
])

const SKIP_EXACT = new Set([
  'username',
  'user',
  'password',
  'current-password',
  'new-password',
  'one-time-code',
  'otp',
  'pin',
  'sku',
  'slug',
  'code',
  'email',
  'phone',
  'tel',
])

const SKIP_TOKENS = new Set([
  'username',
  'password',
  'otp',
  'pin',
  'sku',
  'slug',
  'email',
  'phone',
  'tel',
])

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-')
}

function tokens(value: string): string[] {
  return normalizeKey(value)
    .replace(/([a-z])([0-9])/g, '$1-$2')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function isSkippedIdentifier(value: string | undefined): boolean {
  if (!value) return false
  const exact = normalizeKey(value)
  if (SKIP_EXACT.has(exact) || exact.startsWith('cc-')) return true
  return tokens(value).some((token) => SKIP_TOKENS.has(token))
}

export function isSecretAiAssistField(args: {
  type?: string
  name?: string
  id?: string
  autoComplete?: string
}): boolean {
  const type = (args.type ?? 'text').toLowerCase()
  if (type === 'password') return true
  return (
    isSkippedIdentifier(args.name) ||
    isSkippedIdentifier(args.id) ||
    isSkippedIdentifier(args.autoComplete)
  )
}

export function shouldShowAiAssist(args: {
  aiAssist?: boolean
  type?: string
  name?: string
  id?: string
  autoComplete?: string
  readOnly?: boolean
  disabled?: boolean
  inGroup?: boolean
}): boolean {
  if (args.aiAssist === false) return false
  if (args.readOnly || args.disabled || args.inGroup) return false
  if (args.aiAssist === true) return true
  const type = (args.type ?? 'text').toLowerCase()
  if (type !== 'text' && type !== 'textarea') {
    if (SKIP_TYPES.has(type)) return false
    if (type !== '') return false
  }
  if (isSecretAiAssistField(args)) return false
  return true
}
