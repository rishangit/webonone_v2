import fs from 'fs/promises'
import path from 'path'
import { env } from '../config/env.js'

export interface StorageWriteResult {
  storageKey: string
}

/** Singular resource type in scope → plural folder under the service. */
const SCOPE_TYPE_TO_PLURAL: Record<string, string> = {
  user: 'users',
  service: 'services',
  space: 'spaces',
  product: 'products',
  company: 'companies',
  site: 'sites',
  library: 'library',
  showcase: 'showcase',
}

function sanitizeFileName(fileName: string): string {
  const base = path.basename(fileName)
  return base.replace(/[^A-Za-z0-9._-]/g, '_') || 'file'
}

function sanitizePathSegment(segment: string): string {
  return segment.replace(/[^A-Za-z0-9._-]/g, '_') || '_'
}

/**
 * Map scope `{service}:{type}:{id}[/optional/suffix]` to a hierarchical prefix:
 * `{service}/{pluralType}/{id}[/optional/suffix]`.
 * Avoids `:` in paths (invalid on Windows) without flattening to `__`.
 */
export function sanitizeScopeForStorage(scope: string): string {
  const colonParts = scope.split(':')
  if (colonParts.length < 3) {
    return scope
      .split('/')
      .map((segment) => sanitizePathSegment(segment.replace(/:/g, '_')))
      .filter(Boolean)
      .join('/')
  }

  const service = sanitizePathSegment(colonParts[0] ?? '')
  const resourceType = colonParts[1] ?? ''
  const rest = colonParts.slice(2).join(':')
  const [rawId, ...scopePathParts] = rest.split('/').filter(Boolean)
  const resourceId = sanitizePathSegment(rawId ?? '')
  const plural =
    SCOPE_TYPE_TO_PLURAL[resourceType] ?? `${sanitizePathSegment(resourceType)}s`

  const prefix = [service, plural, resourceId].filter(Boolean).join('/')
  const scopeExtra = scopePathParts.map(sanitizePathSegment).filter(Boolean).join('/')
  return [prefix, scopeExtra].filter(Boolean).join('/')
}

function sanitizeFolderPathForStorage(folderPath: string): string {
  if (folderPath === '/' || folderPath === '') {
    return ''
  }
  return folderPath
    .replace(/^\//, '')
    .split('/')
    .map(sanitizePathSegment)
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
