import { useCallback, useEffect, useState } from 'react'
import { FileIcon, Folder } from 'lucide-react'
import type { MediaItemDto } from '@webonone/media-embed'
import {
  Alert,
  AlertDescription,
  ItemList,
  ItemListContent,
  ItemListItem,
  itemListRowActiveClassName,
  Spinner,
} from '@webonone/ui-kit'
import { listFolders, listMediaItems, type MediaFolderDto } from '../services/mediaApi'
import { useScopedNavigation } from '../hooks/useScopedNavigation'

interface ScopedFolderBrowserProps {
  scope: string
  scopedRoot: string
  mode: 'single' | 'multiple'
  selectedIds?: Set<string>
  onSelectFile?: (item: MediaItemDto) => void
  onToggleSelect?: (item: MediaItemDto) => void
  onNavigate?: (path: string) => void
}

export function ScopedFolderBrowser({
  scope,
  scopedRoot,
  mode,
  selectedIds = new Set(),
  onSelectFile,
  onToggleSelect,
  onNavigate,
}: ScopedFolderBrowserProps) {
  const { currentPath, navigateTo, breadcrumbSegments } = useScopedNavigation(scopedRoot)
  const [folders, setFolders] = useState<MediaFolderDto[]>([])
  const [items, setItems] = useState<MediaItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mediaResult, folderResult] = await Promise.all([
        listMediaItems({ scope, folderPath: currentPath }),
        listFolders(scope, currentPath),
      ])
      setItems(mediaResult.items)
      setFolders(folderResult.folders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder')
    } finally {
      setLoading(false)
    }
  }, [currentPath, scope])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    onNavigate?.(currentPath)
  }, [currentPath, onNavigate])

  function handleFolderOpen(folder: MediaFolderDto) {
    navigateTo(folder.path)
  }

  function handleFileClick(item: MediaItemDto) {
    if (mode === 'single') {
      onSelectFile?.({ ...item, folderPath: currentPath })
    } else {
      onToggleSelect?.({ ...item, folderPath: currentPath })
    }
  }

  function handleFileDoubleClick(item: MediaItemDto) {
    if (mode === 'single') {
      onSelectFile?.({ ...item, folderPath: currentPath })
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbSegments.map((segment, index) => (
          <span key={segment.path} className="flex items-center gap-1">
            {index > 0 ? <span>/</span> : null}
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => navigateTo(segment.path)}
            >
              {segment.label}
            </button>
          </span>
        ))}
      </nav>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <ItemList className="flex-1 overflow-auto">
          {folders.map((folder) => (
            <ItemListItem key={folder.id}>
              <ItemListContent>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left text-sm"
                  onClick={() => handleFolderOpen(folder)}
                  onDoubleClick={() => handleFolderOpen(folder)}
                >
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate font-medium">{folder.name}</span>
                </button>
              </ItemListContent>
            </ItemListItem>
          ))}
          {items.map((item) => (
            <ItemListItem
              key={item.id}
              className={selectedIds.has(item.id) ? itemListRowActiveClassName : undefined}
            >
              <ItemListContent>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left text-sm"
                  onClick={() => handleFileClick(item)}
                  onDoubleClick={() => handleFileDoubleClick(item)}
                >
                  <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{item.fileName}</span>
                </button>
              </ItemListContent>
            </ItemListItem>
          ))}
          {!folders.length && !items.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">This folder is empty</p>
          ) : null}
        </ItemList>
      )}
    </div>
  )
}
