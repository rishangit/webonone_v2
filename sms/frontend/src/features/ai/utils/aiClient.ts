import { getAiApiBase } from './aiConfig'

export async function aiFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${accessToken}`,
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${getAiApiBase()}${path}`, { ...options, headers })
  const data = (await res.json().catch(() => ({}))) as T & { message?: string }
  if (!res.ok) {
    throw new Error(data.message ?? 'Assistant request failed')
  }
  return data
}
