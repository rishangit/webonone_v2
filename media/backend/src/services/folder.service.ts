import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { CreateFolderBody, ListFoldersQuery, MediaFolderDto } from '../schemas/mediaSchemas.js'

interface MediaFolderRow {
  id: string
  scope: string
  path: string
  name: string
  created_by_user_id: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

function rowToDto(row: MediaFolderRow): MediaFolderDto {
  return {
    id: row.id,
    scope: row.scope,
    path: row.path,
    name: row.name,
    createdAt: row.created_at.toISOString(),
  }
}

export async function createFolder(input: CreateFolderBody & { userId: string }): Promise<MediaFolderDto> {
  const existing = await db<MediaFolderRow>('media_folders')
    .where({ scope: input.scope, path: input.path })
    .whereNull('deleted_at')
    .first()

  if (existing) {
    throw new Error('Folder already exists at this path')
  }

  const id = nanoid()
  await db('media_folders').insert({
    id,
    scope: input.scope,
    path: input.path,
    name: input.name,
    created_by_user_id: input.userId,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })

  const row = await db<MediaFolderRow>('media_folders').where({ id }).first()
  return rowToDto(row!)
}

export async function listFolders(query: ListFoldersQuery): Promise<MediaFolderDto[]> {
  const { scope, parentPath } = query
  const prefix = parentPath === '/' ? '/' : parentPath.replace(/\/$/, '')

  const rows = await db<MediaFolderRow>('media_folders')
    .where({ scope })
    .whereNull('deleted_at')
    .andWhere((builder) => {
      if (prefix === '/') {
        builder.where('path', 'like', '/%').andWhere('path', 'not like', '/%/%')
      } else {
        builder.where('path', 'like', `${prefix}/%`).andWhere('path', 'not like', `${prefix}/%/%`)
      }
    })
    .orderBy('name', 'asc')

  return rows.map(rowToDto)
}

export async function renameFolder(id: string, name: string): Promise<MediaFolderDto | null> {
  const row = await db<MediaFolderRow>('media_folders').where({ id }).whereNull('deleted_at').first()
  if (!row) {
    return null
  }

  await db('media_folders').where({ id }).update({
    name,
    updated_at: db.fn.now(3),
  })

  const updated = await db<MediaFolderRow>('media_folders').where({ id }).first()
  return updated ? rowToDto(updated) : null
}

export async function deleteFolder(id: string): Promise<{ deleted: boolean; reason?: string }> {
  const row = await db<MediaFolderRow>('media_folders').where({ id }).whereNull('deleted_at').first()
  if (!row) {
    return { deleted: false, reason: 'Folder not found' }
  }

  const childFolder = await db('media_folders')
    .where({ scope: row.scope })
    .whereNull('deleted_at')
    .andWhere('path', 'like', `${row.path}/%`)
    .first()

  if (childFolder) {
    return { deleted: false, reason: 'Folder is not empty' }
  }

  const mediaInFolder = await db('media_items')
    .where({ scope: row.scope, folder_path: row.path })
    .whereNull('deleted_at')
    .first()

  if (mediaInFolder) {
    return { deleted: false, reason: 'Folder is not empty' }
  }

  await db('media_folders').where({ id }).update({
    deleted_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })

  return { deleted: true }
}
