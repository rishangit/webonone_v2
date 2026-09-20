import { env } from '@/shared/config/env'

export function getAiApiBase(): string {
  return env.aiApiBaseUrl.replace(/\/$/, '')
}
