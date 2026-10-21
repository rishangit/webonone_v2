import { z } from 'zod'
import type { Knex } from 'knex'
import { db } from '../models/db.js'
import { HttpError } from '../services/httpError.js'

export const websitePublishStatuses = ['draft', 'published'] as const
export type WebsitePublishStatus = (typeof websitePublishStatuses)[number]

export const websitePublishStatusSchema = z.enum(websitePublishStatuses)

type Sql = Knex | Knex.Transaction

export function readPublishStatus(value: unknown): WebsitePublishStatus {
  return value === 'draft' ? 'draft' : 'published'
}

export function assertPublishedStatus(status: unknown, message = 'Only a published library item can be used'): void {
  if (readPublishStatus(status) !== 'published') {
    throw new HttpError(409, message, 'WEBSITE_LIBRARY_NOT_PUBLISHED')
  }
}

export async function assertPublishedLibraryIds(
  table: string,
  ids: Array<string | null | undefined>,
  message = 'Only a published library item can be used',
  conn: Sql = db,
): Promise<void> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id?.trim())))]
  if (unique.length === 0) return
  const rows = await conn(table).whereIn('id', unique).select<{ id: string; publish_status: string }[]>('id', 'publish_status')
  if (rows.length !== unique.length || rows.some((row) => row.publish_status !== 'published')) {
    throw new HttpError(409, message, 'WEBSITE_LIBRARY_NOT_PUBLISHED')
  }
}
