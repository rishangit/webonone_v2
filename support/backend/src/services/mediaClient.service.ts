import { env } from '../config/env.js'

export interface MediaItemDetail {
  id: string
  scope: string
  fileName: string
  mimeType: string
  url: string
  uploadedByUserId?: string
}

export async function fetchMediaItem(
  mediaId: string,
  accessToken: string,
): Promise<MediaItemDetail | null> {
  const base = env.mediaApiBaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/media/${encodeURIComponent(mediaId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new Error('MEDIA_FETCH_FAILED')
  }
  const data = (await res.json()) as { item?: MediaItemDetail }
  return data.item ?? null
}
