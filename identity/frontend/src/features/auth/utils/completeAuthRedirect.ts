const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_IDENTITY_API_BASE_URL ??
  'http://localhost:4001/api/v1'

export async function completeAuthRedirect(
  accessToken: string,
  redirectUri: string,
  state: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ redirectUri }),
  })

  const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string }
  if (!res.ok || !data.code) {
    throw new Error(data.message ?? 'Failed to create authorization code')
  }

  const url = new URL(redirectUri)
  url.searchParams.set('code', data.code)
  url.searchParams.set('state', state)
  window.location.assign(url.toString())
}
