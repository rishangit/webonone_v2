import Constants from 'expo-constants'

export function getWebOnOneAppVersionLabel(): string {
  const raw = Constants.expoConfig?.version ?? '1.0.0'
  const trimmed = raw.trim()
  if (!trimmed) return 'v0.0.0'
  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`
}
