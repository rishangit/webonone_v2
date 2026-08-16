export function getAiOrigin(): string {
  return import.meta.env.VITE_AI_ORIGIN ?? 'http://127.0.0.1:3020'
}

export function getAiApiBase(): string {
  return import.meta.env.VITE_AI_API_BASE_URL ?? 'http://127.0.0.1:4020/api/v1'
}
