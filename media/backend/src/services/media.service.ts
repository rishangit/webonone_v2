import { nanoid } from 'nanoid'
import sharp from 'sharp'
import { db } from '../models/db.js'
import type { ListMediaQuery, MediaItemDto } from '../schemas/mediaSchemas.js'
import {
  buildPublicUrl,
  buildStorageKey,
  deleteBlob,
  isMimeAllowed,
  writeBlob,
} from './storage.service.js'
import { ensureFolderPath } from './folder.service.js'
import { env } from '../config/env.js'

interface MediaItemRow {
  id: string
  scope: string
  folder_path: string
  file_name: string
  storage_key: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  public_url: string
  uploaded_by_user_id: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

function rowToDto(row: MediaItemRow): MediaItemDto {
  return {
    id: row.id,
    scope: row.scope,
    folderPath: row.folder_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    width: row.width,
    height: row.height,
    url: buildPublicUrl(row.id, row.file_name),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function extractImageDimensions(
  buffer: Buffer,
  mimeType: string,
): Promise<{ width: number | null; height: number | null }> {
  if (!mimeType.startsWith('image/')) {
    return { width: null, height: null }
  }
  try {
    const meta = await sharp(buffer).metadata()
    return { width: meta.width ?? null, height: meta.height ?? null }
  } catch {
    return { width: null, height: null }
  }
}

export async function uploadMediaItem(input: {
  scope: string
  folderPath: string
  fileName: string
  mimeType: string
  buffer: Buffer
  userId: string
}): Promise<MediaItemDto> {
  if (input.buffer.length > env.maxFileSizeBytes) {
    throw new Error(`File exceeds maximum size of ${env.maxFileSizeBytes} bytes`)
  }
  if (!isMimeAllowed(input.mimeType)) {
    throw new Error(`MIME type not allowed: ${input.mimeType}`)
  }

  const id = nanoid()
  const storageKey = buildStorageKey(input.scope, input.folderPath, id, input.fileName)
  const publicUrl = buildPublicUrl(id, input.fileName)
  const dimensions = await extractImageDimensions(input.buffer, input.mimeType)

  await ensureFolderPath(input.scope, input.folderPath, input.userId)

  const trx = await db.transaction()
  try {
    await trx('media_items').insert({
      id,
      scope: input.scope,
      folder_path: input.folderPath,
      file_name: input.fileName,
      storage_key: storageKey,
      mime_type: input.mimeType,
      size_bytes: input.buffer.length,
      width: dimensions.width,
      height: dimensions.height,
      public_url: publicUrl,
      uploaded_by_user_id: input.userId,
      created_at: trx.fn.now(3),
      updated_at: trx.fn.now(3),
    })

    await writeBlob(storageKey, input.buffer)
    await trx.commit()

    const row = await db<MediaItemRow>('media_items').where({ id }).first()
    return rowToDto(row!)
  } catch (err) {
    await trx.rollback()
    await deleteBlob(storageKey).catch(() => undefined)
    throw err
  }
}

export async function listMediaItems(query: ListMediaQuery): Promise<{
  items: MediaItemDto[]
  total: number
  page: number
  pageSize: number
}> {
  const { scope, folderPath, page, pageSize, mimeType } = query
  const baseQuery = db<MediaItemRow>('media_items')
    .where({ scope, folder_path: folderPath })
    .whereNull('deleted_at')

  if (mimeType) {
    baseQuery.andWhere('mime_type', 'like', `${mimeType}%`)
  }

  const countResult = (await baseQuery.clone().count('* as total')) as { total: string | number }[]
  const total = Number(countResult[0]?.total ?? 0)

  const rows = await baseQuery
    .clone()
    .orderBy('created_at', 'desc')
    .offset((page - 1) * pageSize)
    .limit(pageSize)

  return {
    items: rows.map(rowToDto),
    total,
    page,
    pageSize,
  }
}

export async function getMediaItemById(id: string): Promise<MediaItemDto | null> {
  const row = await db<MediaItemRow>('media_items').where({ id }).whereNull('deleted_at').first()
  return row ? rowToDto(row) : null
}

export async function deleteMediaItem(id: string): Promise<boolean> {
  const row = await db<MediaItemRow>('media_items').where({ id }).whereNull('deleted_at').first()
  if (!row) {
    return false
  }

  await db('media_items').where({ id }).update({
    deleted_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })

  deleteBlob(row.storage_key).catch((err) => {
    console.error('Failed to delete blob for media item', id, err)
  })

  return true
}

export async function getMediaItemRow(id: string): Promise<MediaItemRow | null> {
  return (await db<MediaItemRow>('media_items').where({ id }).whereNull('deleted_at').first()) ?? null
}
