export function normalizeStoredFolderPath(path: string): string {
  if (!path || path === '/') return '/'
  const withLeading = path.startsWith('/') ? path : `/${path}`
  return withLeading.replace(/\/+$/, '') || '/'
}

export function parentOfFolder(path: string): string {
  const current = normalizeStoredFolderPath(path)
  if (current === '/') return '/'
  const index = current.lastIndexOf('/')
  return index <= 0 ? '/' : current.slice(0, index)
}

export function folderNameOf(path: string): string {
  const current = normalizeStoredFolderPath(path)
  const index = current.lastIndexOf('/')
  return current.slice(index + 1)
}

export function joinFolder(parent: string, name: string): string {
  const base = normalizeStoredFolderPath(parent)
  return base === '/' ? `/${name}` : `${base}/${name}`
}

export function rebaseFolderPath(path: string, fromPath: string, toPath: string): string {
  const current = normalizeStoredFolderPath(path)
  const from = normalizeStoredFolderPath(fromPath)
  const to = normalizeStoredFolderPath(toPath)
  if (current === from) return to
  if (current.startsWith(`${from}/`)) return `${to}${current.slice(from.length)}`
  return current
}

/** Why a folder cannot be dropped on this parent. Null means the move is allowed. */
export function folderDropRejection(fromPath: string, toParentPath: string): string | null {
  const from = normalizeStoredFolderPath(fromPath)
  const parent = normalizeStoredFolderPath(toParentPath)
  if (from === '/') return 'The root folder cannot be moved'
  if (parent === from) return 'A folder cannot be moved into itself'
  if (parent.startsWith(`${from}/`)) return 'A folder cannot be moved into its own subfolder'
  if (parent === parentOfFolder(from)) return 'Already in this folder'
  return null
}

export function likeChildPrefix(path: string): string {
  const escaped = normalizeStoredFolderPath(path).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
  return `${escaped}/%`
}
