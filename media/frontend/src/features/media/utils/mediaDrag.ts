import { isPathWithinScope, normalizeFolderPath } from '../hooks/useScopedNavigation'

export type MediaDragPayload = {
  kind: 'file' | 'folder'
  id: string
  /** Folder path. For a file this is the folder that currently contains it. */
  path: string
  name: string
}

let activeDrag: MediaDragPayload | null = null

export function beginMediaDrag(payload: MediaDragPayload): void {
  activeDrag = {
    ...payload,
    path: normalizeFolderPath(payload.path),
  }
}

export function readMediaDrag(): MediaDragPayload | null {
  return activeDrag
}

export function endMediaDrag(): void {
  activeDrag = null
}

function parentOf(path: string): string {
  const current = normalizeFolderPath(path)
  if (current === '/') return '/'
  const index = current.lastIndexOf('/')
  return index <= 0 ? '/' : current.slice(0, index)
}

/** True when the active drag can be dropped onto this folder. */
export function canDropMediaOnFolder(targetPath: string, scopedRoot = '/'): boolean {
  const drag = activeDrag
  if (!drag) return false
  const target = normalizeFolderPath(targetPath)
  if (!isPathWithinScope(target, scopedRoot)) return false

  if (drag.kind === 'file') {
    return drag.path !== target
  }

  if (target === drag.path) return false
  if (target.startsWith(`${drag.path}/`)) return false
  if (target === parentOf(drag.path)) return false
  return true
}
