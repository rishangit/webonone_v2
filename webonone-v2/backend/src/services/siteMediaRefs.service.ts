import { nanoid } from 'nanoid'
import { db, type SiteMediaRefRow } from '../models/db.js'
import { rewriteMediaFileUrl } from '../utils/rewriteMediaFileUrl.js'

export interface SiteMediaRefDto {
  id: string
  siteId: string
  mediaId: string
  mediaUrl: string
  label: string | null
}

function rowToDto(row: SiteMediaRefRow): SiteMediaRefDto {
  return {
    id: row.id,
    siteId: row.site_id,
    mediaId: row.media_id,
    mediaUrl: rewriteMediaFileUrl(row.media_url),
    label: row.label,
  }
}

export async function listSiteMediaRefs(siteId: string): Promise<SiteMediaRefDto[]> {
  const rows = await db<SiteMediaRefRow>('site_media_refs')
    .where({ site_id: siteId })
    .orderBy('created_at', 'desc')
  return rows.map(rowToDto)
}

export async function createSiteMediaRefs(
  siteId: string,
  items: { mediaId: string; mediaUrl: string; label?: string | null }[],
): Promise<SiteMediaRefDto[]> {
  const created: SiteMediaRefDto[] = []
  for (const item of items) {
    const id = nanoid()
    await db('site_media_refs').insert({
      id,
      site_id: siteId,
      media_id: item.mediaId,
      media_url: item.mediaUrl,
      label: item.label ?? null,
      created_at: db.fn.now(3),
      updated_at: db.fn.now(3),
    })
    const row = await db<SiteMediaRefRow>('site_media_refs').where({ id }).first()
    if (row) {
      created.push(rowToDto(row))
    }
  }
  return created
}

export async function deleteSiteMediaRef(id: string, siteId: string): Promise<boolean> {
  const deleted = await db('site_media_refs').where({ id, site_id: siteId }).del()
  return deleted > 0
}
