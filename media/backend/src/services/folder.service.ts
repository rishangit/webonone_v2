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

/**
 * Immediate child folder under parentPath derived from a deeper folderPath.
 * e.g. parent `/`, path `/products/abc` → { name: products, path: /products }
 *      parent `/products`, path `/products/abc` → { name: abc, path: /products/abc }
 */
export function childFolderFromPath(
  parentPath: string,
  folderPath: string,
): { name: string; path: string } | null {
  const parent = parentPath === '/' ? '/' : parentPath.replace(/\/$/, '') || '/'
  const current = folderPath === '/' ? '/' : folderPath.replace(/\/$/, '') || '/'
  if (current === '/' || current === parent) {
    return null
  }

  if (parent === '/') {
    if (!current.startsWith('/')) {
      return null
    }
    const name = current.slice(1).split('/').filter(Boolean)[0]
    if (!name) {
      return null
    }
    return { name, path: `/${name}` }
  }

  if (!current.startsWith(`${parent}/`)) {
    return null
  }
  const name = current.slice(parent.length + 1).split('/').filter(Boolean)[0]
  if (!name) {
    return null
  }
  return { name, path: `${parent}/${name}` }
}

/** Create each path segment as a media_folders row when missing (upload / ensure). */
export async function ensureFolderPath(
  scope: string,
  folderPath: string,
  userId: string,
): Promise<void> {
  if (!folderPath || folderPath === '/') {
    return
  }

  const parts = folderPath.split('/').filter(Boolean)
  let current = ''
  for (const part of parts) {
    current = `${current}/${part}`
    const existing = await db<MediaFolderRow>('media_folders')
      .where({ scope, path: current })
      .whereNull('deleted_at')
      .first()
    if (existing) {
      continue
    }
    try {
      await createFolder({ scope, path: current, name: part, userId })
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (!message.toLowerCase().includes('already exists')) {
        throw err
      }
    }
  }
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

  const byPath = new Map<string, MediaFolderDto>()
  for (const row of rows) {
    byPath.set(row.path, rowToDto(row))
  }

  // Uploads historically wrote media_items without media_folders rows. Infer
  // child folders from distinct folder_path values so the picker can navigate.
  const mediaPathsQuery = db('media_items')
    .where({ scope })
    .whereNull('deleted_at')
    .distinct('folder_path')

  if (prefix === '/') {
    mediaPathsQuery.andWhere('folder_path', 'like', '/%').andWhere('folder_path', '!=', '/')
  } else {
    mediaPathsQuery.andWhere('folder_path', 'like', `${prefix}/%`)
  }

  const mediaPaths = (await mediaPathsQuery) as { folder_path: string }[]
  for (const entry of mediaPaths) {
    const child = childFolderFromPath(prefix, entry.folder_path)
    if (!child || byPath.has(child.path)) {
      continue
    }
    byPath.set(child.path, {
      id: `inferred:${scope}:${child.path}`,
      scope,
      path: child.path,
      name: child.name,
      createdAt: new Date(0).toISOString(),
    })
  }

  return Array.from(byPath.values()).sort((a, b) => a.name.localeCompare(b.name))
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
