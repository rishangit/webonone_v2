import { useCallback, useMemo, useState } from 'react'

export function normalizeFolderPath(path: string): string {
  if (!path || path === '/') {
    return '/'
  }
  const withLeading = path.startsWith('/') ? path : `/${path}`
  const trimmed = withLeading.replace(/\/+$/, '')
  return trimmed || '/'
}

export function isPathWithinScope(path: string, scopedRoot: string): boolean {
  const current = normalizeFolderPath(path)
  const root = normalizeFolderPath(scopedRoot)
  if (root === '/') {
    return true
  }
  return current === root || current.startsWith(`${root}/`)
}

export interface BreadcrumbSegment {
  label: string
  path: string
}

export function buildBreadcrumbSegments(
  scopedRoot: string,
  currentPath: string,
  rootLabel = 'Root',
): BreadcrumbSegment[] {
  const root = normalizeFolderPath(scopedRoot)
  const current = normalizeFolderPath(currentPath)
  const segments: BreadcrumbSegment[] = []

  if (root === '/') {
    segments.push({ label: rootLabel, path: '/' })
    if (current === '/') {
      return segments
    }
    const parts = current.split('/').filter(Boolean)
    let path = ''
    for (const part of parts) {
      path = `${path}/${part}`
      segments.push({ label: part, path })
    }
    return segments
  }

  segments.push({ label: root.split('/').filter(Boolean).pop() ?? root, path: root })
  if (current === root) {
    return segments
  }

  const relative = current.slice(root.length).split('/').filter(Boolean)
  let path = root
  for (const part of relative) {
    path = `${path}/${part}`
    segments.push({ label: part, path })
  }
  return segments
}

function resolveInitialPath(scopedRoot: string, initialPath?: string): string {
  const root = normalizeFolderPath(scopedRoot)
  if (initialPath === undefined) {
    return root
  }
  const start = normalizeFolderPath(initialPath)
  return isPathWithinScope(start, root) ? start : root
}

export function useScopedNavigation(
  scopedRoot: string,
  initialPath?: string,
  rootLabel = 'Root',
) {
  const normalizedRoot = useMemo(() => normalizeFolderPath(scopedRoot), [scopedRoot])
  const [currentPath, setCurrentPath] = useState(() =>
    resolveInitialPath(normalizedRoot, initialPath),
  )

  const navigateTo = useCallback(
    (path: string) => {
      const normalized = normalizeFolderPath(path)
      if (isPathWithinScope(normalized, normalizedRoot)) {
        setCurrentPath(normalized)
      }
    },
    [normalizedRoot],
  )

  const breadcrumbSegments = useMemo(
    () => buildBreadcrumbSegments(normalizedRoot, currentPath, rootLabel),
    [currentPath, normalizedRoot, rootLabel],
  )

  return {
    scopedRoot: normalizedRoot,
    currentPath,
    navigateTo,
    breadcrumbSegments,
    canNavigateTo: (path: string) => isPathWithinScope(path, normalizedRoot),
  }
}
