import { QUERY } from './constants'
import type { RedirectWithAuthCodeOptions } from './types'

export async function redirectWithAuthCode(opts: RedirectWithAuthCodeOptions): Promise<void> {
  const res = await fetch(opts.authCodeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.accessToken}`,
    },
    body: JSON.stringify({ redirectUri: opts.targetUrl }),
  })

  const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string }
  if (!res.ok || !data.code) {
    throw new Error(data.message ?? opts.errorMessage ?? 'Failed to create authorization code')
  }

  const url = new URL(opts.targetUrl)
  url.searchParams.set(QUERY.CODE, data.code)

  if (opts.returnUrl) {
    url.searchParams.set(QUERY.RETURN_URL, opts.returnUrl)
  }
  if (opts.state) {
    url.searchParams.set(QUERY.STATE, opts.state)
  }
  if (opts.extraSearchParams) {
    for (const [key, value] of Object.entries(opts.extraSearchParams)) {
      url.searchParams.set(key, value)
    }
  }

  window.location.assign(url.toString())
}
