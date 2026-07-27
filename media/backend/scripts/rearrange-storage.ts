/**
 * One-off: move local blobs + rewrite media_items.storage_key / folder_path
 * (and media_folders.path) to the service-first layout.
 *
 * Usage: npm run rearrange-storage -w @webonone/media-backend
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import knex from 'knex'
import { buildStorageKey } from '../src/services/storage.service.js'

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(backendRoot, '.env') })

const storageRoot = path.resolve(
  backendRoot,
  process.env.MEDIA_LOCAL_STORAGE_PATH ?? './storage',
)

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
})

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Strip optional path suffix from scope into folderPath (e.g. site:id/gallery). */
function splitScopeSuffix(scope: string): { scope: string; suffixFolder: string } {
  const match = scope.match(/^([a-z0-9-]+:[a-z0-9-]+:[A-Za-z0-9_-]+)(\/.*)?$/i)
  if (!match) return { scope, suffixFolder: '' }
  const suffix = match[2] ?? ''
  return {
    scope: match[1],
    suffixFolder: suffix ? (suffix.startsWith('/') ? suffix : `/${suffix}`) : '',
  }
}

/**
 * Map legacy folder_path (+ optional scope suffix) to the agreed contract paths.
 */
export function mapToNewFolderContract(
  rawScope: string,
  rawFolderPath: string,
): { scope: string; folderPath: string } {
  const { scope: baseScope, suffixFolder } = splitScopeSuffix(rawScope)
  let folderPath = rawFolderPath || '/'
  if (suffixFolder && (folderPath === '/' || folderPath === '')) {
    folderPath = suffixFolder
  }

  if (baseScope.startsWith('identity:user:')) {
    return { scope: baseScope, folderPath: '/' }
  }

  if (baseScope.startsWith('data:')) {
    return { scope: baseScope, folderPath: '/' }
  }

  if (baseScope.startsWith('media:library:') || baseScope.startsWith('media:showcase:')) {
    return { scope: baseScope, folderPath: '/' }
  }

  if (baseScope.startsWith('webonone:company:')) {
    const companyId = baseScope.slice('webonone:company:'.length)
    const profileOrGallery = folderPath.match(
      new RegExp(`^/companies/${escapeRegex(companyId)}/(profile|gallery)$`),
    )
    if (profileOrGallery) {
      return { scope: baseScope, folderPath: `/${profileOrGallery[1]}` }
    }
    const catalog = folderPath.match(
      new RegExp(
        `^/company/${escapeRegex(companyId)}/(products|services|spaces)/([^/]+)(?:/gallery)?$`,
      ),
    )
    if (catalog) {
      return { scope: baseScope, folderPath: `/${catalog[1]}/${catalog[2]}` }
    }
    if (/^\/(profile|gallery)$/.test(folderPath)) {
      return { scope: baseScope, folderPath }
    }
    if (/^\/(products|services|spaces)\/[^/]+$/.test(folderPath)) {
      return { scope: baseScope, folderPath }
    }
    return { scope: baseScope, folderPath }
  }

  if (baseScope.startsWith('webonone:site:')) {
    if (folderPath === '/' || folderPath === '') {
      return { scope: baseScope, folderPath: suffixFolder || '/' }
    }
    return { scope: baseScope, folderPath }
  }

  return { scope: baseScope, folderPath }
}

function storageKeyToAbs(storageKey: string): string {
  return path.join(storageRoot, ...storageKey.split('/').filter(Boolean))
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function moveFile(from: string, to: string): Promise<'moved' | 'missing' | 'same' | 'exists'> {
  if (path.normalize(from) === path.normalize(to)) return 'same'
  if (!(await pathExists(from))) return 'missing'
  if (await pathExists(to)) return 'exists'
  await fs.mkdir(path.dirname(to), { recursive: true })
  await fs.rename(from, to)
  return 'moved'
}

/** Heuristic migrate for files under legacy `service__type__id/...` trees with no/stale DB row. */
async function migrateOrphanFiles(): Promise<number> {
  let moved = 0
  const topDirs = await fs.readdir(storageRoot, { withFileTypes: true })
  for (const dir of topDirs) {
    if (!dir.isDirectory() || !dir.name.includes('__')) continue
    const legacyRoot = path.join(storageRoot, dir.name)
    const files = await listFilesRecursive(legacyRoot)
    for (const abs of files) {
      const rel = path.relative(storageRoot, abs).split(path.sep).join('/')
      const mapped = mapLegacyDiskKeyToNew(rel)
      if (!mapped || mapped === rel) continue
      const dest = storageKeyToAbs(mapped)
      const result = await moveFile(abs, dest)
      if (result === 'moved') {
        console.log(`orphan move: ${rel} → ${mapped}`)
        moved += 1
      }
    }
  }
  return moved
}

function mapLegacyDiskKeyToNew(relPosix: string): string | null {
  // identity__user__U1/root/users/U1/{mediaId}/{file}
  let m = relPosix.match(
    /^identity__user__([^/]+)\/root\/users\/\1\/([^/]+)\/([^/]+)$/,
  )
  if (m) return `identity/users/${m[1]}/${m[2]}/${m[3]}`

  // data__service__E1/services/E1/gallery/{mediaId}/{file}
  m = relPosix.match(
    /^data__(service|space|product)__([^/]+)\/(services|spaces|products)\/\2\/gallery\/([^/]+)\/([^/]+)$/,
  )
  if (m) {
    const plural =
      m[1] === 'service' ? 'services' : m[1] === 'space' ? 'spaces' : 'products'
    return `data/${plural}/${m[2]}/${m[4]}/${m[5]}`
  }

  // webonone__company__C1/companies/C1/(profile|gallery)/{mediaId}/{file}
  m = relPosix.match(
    /^webonone__company__([^/]+)\/companies\/\1\/(profile|gallery)\/([^/]+)\/([^/]+)$/,
  )
  if (m) return `webonone/companies/${m[1]}/${m[2]}/${m[3]}/${m[4]}`

  // webonone__company__C1/company/C1/(services|spaces|products)/E1/gallery/{mediaId}/{file}
  m = relPosix.match(
    /^webonone__company__([^/]+)\/company\/\1\/(services|spaces|products)\/([^/]+)\/gallery\/([^/]+)\/([^/]+)$/,
  )
  if (m) return `webonone/companies/${m[1]}/${m[2]}/${m[3]}/${m[4]}/${m[5]}`

  // webonone__site__S1/gallery/{mediaId}/{file}  or S1/{mediaId}/{file}
  m = relPosix.match(/^webonone__site__([^/]+)\/gallery\/([^/]+)\/([^/]+)$/)
  if (m) return `webonone/sites/${m[1]}/gallery/${m[2]}/${m[3]}`
  m = relPosix.match(/^webonone__site__([^/]+)\/([^/]+)\/([^/]+)$/)
  if (m) return `webonone/sites/${m[1]}/${m[2]}/${m[3]}`

  // media__library__default/root/users/.../profile/{mediaId}/{file} → media/library/default/...
  m = relPosix.match(/^media__library__default\/root\/users\/[^/]+\/profile\/([^/]+)\/([^/]+)$/)
  if (m) return `media/library/default/${m[1]}/${m[2]}`
  m = relPosix.match(/^media__library__default\/([^/]+)\/([^/]+)$/)
  if (m) return `media/library/default/${m[1]}/${m[2]}`

  // media__showcase__default/...
  m = relPosix.match(/^media__showcase__default\/(?:root\/.*\/)?([^/]+)\/([^/]+)$/)
  if (m) return `media/showcase/default/${m[1]}/${m[2]}`

  return null
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await listFilesRecursive(full)))
    } else if (entry.isFile()) {
      out.push(full)
    }
  }
  return out
}

async function removeEmptyDirs(dir: string): Promise<void> {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await removeEmptyDirs(path.join(dir, entry.name))
    }
  }
  entries = await fs.readdir(dir, { withFileTypes: true })
  if (entries.length === 0) {
    await fs.rmdir(dir).catch(() => undefined)
  }
}

async function pruneLegacyRoots(): Promise<void> {
  const topDirs = await fs.readdir(storageRoot, { withFileTypes: true })
  for (const dir of topDirs) {
    if (!dir.isDirectory() || !dir.name.includes('__')) continue
    const legacyRoot = path.join(storageRoot, dir.name)
    await removeEmptyDirs(legacyRoot)
    const left = await fs.readdir(legacyRoot).catch(() => ['x'])
    if (left.length === 0) {
      await fs.rmdir(legacyRoot).catch(() => undefined)
      console.log(`removed empty legacy root: ${dir.name}`)
    } else {
      console.log(`legacy root still has entries: ${dir.name} (${left.length})`)
    }
  }
}

async function main(): Promise<void> {
  console.log(`storage root: ${storageRoot}`)

  const items = await db('media_items').select(
    'id',
    'scope',
    'folder_path',
    'file_name',
    'storage_key',
  )

  let updatedItems = 0
  let movedFiles = 0

  for (const row of items) {
    const mapped = mapToNewFolderContract(row.scope, row.folder_path)
    const newKey = buildStorageKey(mapped.scope, mapped.folderPath, row.id, row.file_name)
    const oldAbs = storageKeyToAbs(row.storage_key)
    const newAbs = storageKeyToAbs(newKey)

    const moveResult = await moveFile(oldAbs, newAbs)
    if (moveResult === 'moved') {
      movedFiles += 1
      console.log(`item move: ${row.id} → ${newKey}`)
    } else if (moveResult === 'missing' && row.storage_key !== newKey) {
      console.log(`item missing blob (key update only): ${row.id}`)
    } else if (moveResult === 'exists') {
      console.log(`item target exists, key update only: ${row.id}`)
    }

    if (
      row.scope !== mapped.scope ||
      row.folder_path !== mapped.folderPath ||
      row.storage_key !== newKey
    ) {
      await db('media_items').where({ id: row.id }).update({
        scope: mapped.scope,
        folder_path: mapped.folderPath,
        storage_key: newKey,
        updated_at: db.fn.now(3),
      })
      updatedItems += 1
    }
  }

  const folders = await db('media_folders').select('id', 'scope', 'path', 'name')
  let updatedFolders = 0
  for (const folder of folders) {
    const mapped = mapToNewFolderContract(folder.scope, folder.path)
    // Intermediate legacy folders under media library/showcase collapse to `/` — soft-delete extras
    const isLegacyRootTree =
      (folder.scope.startsWith('media:library:') || folder.scope.startsWith('media:showcase:')) &&
      (folder.path === '/root' ||
        folder.path.startsWith('/root/') ||
        folder.path.includes('/users/'))

    if (isLegacyRootTree) {
      await db('media_folders').where({ id: folder.id }).update({
        deleted_at: db.fn.now(3),
        updated_at: db.fn.now(3),
      })
      updatedFolders += 1
      console.log(`folder soft-deleted (legacy): ${folder.scope} ${folder.path}`)
      continue
    }

    if (folder.scope !== mapped.scope || folder.path !== mapped.folderPath) {
      // Avoid unique-ish duplicates: if another folder already has new path, soft-delete this one
      const existing = await db('media_folders')
        .where({ scope: mapped.scope, path: mapped.folderPath })
        .whereNull('deleted_at')
        .whereNot({ id: folder.id })
        .first()
      if (existing) {
        await db('media_folders').where({ id: folder.id }).update({
          deleted_at: db.fn.now(3),
          updated_at: db.fn.now(3),
        })
      } else {
        await db('media_folders').where({ id: folder.id }).update({
          scope: mapped.scope,
          path: mapped.folderPath,
          name: path.posix.basename(mapped.folderPath) || folder.name,
          updated_at: db.fn.now(3),
        })
      }
      updatedFolders += 1
      console.log(`folder update: ${folder.scope} ${folder.path} → ${mapped.scope} ${mapped.folderPath}`)
    }
  }

  const orphanMoved = await migrateOrphanFiles()
  await pruneLegacyRoots()

  console.log(
    JSON.stringify(
      {
        items: items.length,
        updatedItems,
        movedFiles,
        updatedFolders,
        orphanMoved,
      },
      null,
      2,
    ),
  )

  await db.destroy()
}

main().catch(async (err) => {
  console.error(err)
  await db.destroy().catch(() => undefined)
  process.exit(1)
})
