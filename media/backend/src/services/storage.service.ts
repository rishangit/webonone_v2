import fs from 'fs/promises'
import path from 'path'
import { env } from '../config/env.js'

export interface StorageWriteResult {
  storageKey: string
}

function sanitizeFileName(fileName: string): string {
  const base = path.basename(fileName)
  return base.replace(/[^A-Za-z0-9._-]/g, '_') || 'file'
}

/** Scope uses `:` separators; encode for cross-platform blob paths (Windows disallows `:` in folder names). */
function sanitizeScopeForStorage(scope: string): string {
  return scope
    .split('/')
    .map((segment) => segment.replace(/:/g, '__'))
    .join('/')
}

function sanitizeFolderPathForStorage(folderPath: string): string {
  if (folderPath === '/' || folderPath === '') {
    return ''
  }
  return folderPath
    .replace(/^\//, '')
    .split('/')
    .map((segment) => segment.replace(/[^A-Za-z0-9._-]/g, '_'))
    .filter(Boolean)
    .join('/')
}

function storageKeyToLocalPath(storageKey: string): string {
  const segments = storageKey.split('/').filter(Boolean)
  return path.join(env.localStoragePath, ...segments)
}

export function buildStorageKey(
  scope: string,
  folderPath: string,
  mediaId: string,
  fileName: string,
): string {
  const scopePart = sanitizeScopeForStorage(scope)
  const folderPart = sanitizeFolderPathForStorage(folderPath)
  const parts = [scopePart, folderPart, mediaId, sanitizeFileName(fileName)].filter(Boolean)
  return parts.join('/')
}

export function buildPublicUrl(mediaId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName)
  return `${env.publicBaseUrl}/files/${mediaId}/${safeName}`
}

export async function writeLocalBlob(storageKey: string, buffer: Buffer): Promise<void> {
  const fullPath = storageKeyToLocalPath(storageKey)
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, buffer)
}

export async function readLocalBlob(storageKey: string): Promise<Buffer> {
  const fullPath = storageKeyToLocalPath(storageKey)
  return fs.readFile(fullPath)
}

export async function deleteLocalBlob(storageKey: string): Promise<void> {
  const fullPath = storageKeyToLocalPath(storageKey)
  try {
    await fs.unlink(fullPath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
}

export async function writeBlob(storageKey: string, buffer: Buffer): Promise<StorageWriteResult> {
  if (env.storageDriver === 's3') {
    throw new Error('S3 storage driver is not configured for local development')
  }
  await writeLocalBlob(storageKey, buffer)
  return { storageKey }
}

export async function readBlob(storageKey: string): Promise<Buffer> {
  if (env.storageDriver === 's3') {
    throw new Error('S3 storage driver is not configured for local development')
  }
  return readLocalBlob(storageKey)
}

export async function deleteBlob(storageKey: string): Promise<void> {
  if (env.storageDriver === 's3') {
    throw new Error('S3 storage driver is not configured for local development')
  }
  await deleteLocalBlob(storageKey)
}

export function isMimeAllowed(mimeType: string): boolean {
  return env.allowedMimeTypes.some((pattern) => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1)
      return mimeType.startsWith(prefix)
    }
    return mimeType === pattern
  })
}
