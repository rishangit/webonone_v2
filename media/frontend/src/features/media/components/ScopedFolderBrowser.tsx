import { useCallback, useEffect, useState } from 'react'
import { FileIcon, Folder, FolderPlus, LayoutGrid, List } from 'lucide-react'
import type { MediaItemDto } from '@webonone/media-embed'
import {
  Alert,
  AlertDescription,
  Button,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListRowActiveClassName,
  Spinner,
} from '@webonone/ui-kit'
import { CreateFolderDialog } from './CreateFolderDialog'
import { MediaDeleteDialog } from './MediaDeleteDialog'
import { MediaPreviewDialog } from './MediaPreviewDialog'
import { useScopedNavigation } from '../hooks/useScopedNavigation'
import {
  createFolder,
  deleteMediaItem,
  listFolders,
  listMediaItems,
  type MediaFolderDto,
} from '../services/mediaApi'
import { formatFileSize, formatMediaDate } from '../utils/formatMedia'

type BrowserViewMode = 'list' | 'thumb'

interface ScopedFolderBrowserProps {
  scope: string
  scopedRoot: string
  mode: 'single' | 'multiple'
  selectedIds?: Set<string>
  refreshKey?: number
  onSelectFile?: (item: MediaItemDto) => void
  onToggleSelect?: (item: MediaItemDto) => void
  onNavigate?: (path: string) => void
  /** Icon toolbar with create folder + list/thumb toggle (selector embed). */
  showIconToolbar?: boolean
  allowDelete?: boolean
}

export function ScopedFolderBrowser({
  scope,
  scopedRoot,
  mode,
  selectedIds = new Set(),
  refreshKey = 0,
  onSelectFile,
  onToggleSelect,
  onNavigate,
  showIconToolbar = false,
  allowDelete = false,
}: ScopedFolderBrowserProps) {
  const { currentPath, navigateTo, breadcrumbSegments } = useScopedNavigation(scopedRoot)
  const [folders, setFolders] = useState<MediaFolderDto[]>([])
  const [items, setItems] = useState<MediaItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<BrowserViewMode>('list')
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaItemDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaItemDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mediaResult, folderResult] = await Promise.all([
        listMediaItems({ scope, folderPath: currentPath, pageSize: 100 }),
        listFolders(scope, currentPath),
      ])
      setItems(mediaResult.items)
      setFolders(folderResult.folders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder')
    } finally {
      setLoading(false)
    }
  }, [currentPath, refreshKey, scope])

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
    const withPath = { ...item, folderPath: currentPath }
    if (mode === 'single') {
      onSelectFile?.(withPath)
    } else {
      onToggleSelect?.(withPath)
    }
  }

  function handleFileDoubleClick(item: MediaItemDto) {
    if (mode === 'single') {
      onSelectFile?.({ ...item, folderPath: currentPath })
    }
  }

  async function handleCreateFolder(name: string) {
    const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
    await createFolder(scope, path, name)
    await loadData()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteMediaItem(deleteTarget.id)
      setDeleteTarget(null)
      await loadData()
    } finally {
      setIsDeleting(false)
    }
  }

  function renderFileMeta(item: MediaItemDto) {
    const modified = formatMediaDate(item.updatedAt ?? item.createdAt)
    return (
      <p className="text-xs text-muted-foreground">
        {formatFileSize(item.sizeBytes)} · {modified}
      </p>
    )
  }

  function renderFileMenu(item: MediaItemDto) {
    const isImage = item.mimeType.startsWith('image/')
    return (
      <ItemListMenu ariaLabel={`Actions for ${item.fileName}`}>
        {isImage ? (
          <DropdownMenuItem onClick={() => setPreviewItem(item)}>View image</DropdownMenuItem>
        ) : null}
        {allowDelete ? (
          <>
            {isImage ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteTarget(item)}
            >
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  function renderListView() {
    const hasRows = folders.length > 0 || items.length > 0

    if (!hasRows) {
      return <ItemListEmpty>This folder is empty</ItemListEmpty>
    }

    return (
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
                className="flex w-full items-start gap-2 text-left text-sm"
                onClick={() => handleFileClick(item)}
                onDoubleClick={() => handleFileDoubleClick(item)}
              >
                <FileIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.fileName}</span>
                  {renderFileMeta(item)}
                </span>
              </button>
            </ItemListContent>
            {showIconToolbar ? renderFileMenu(item) : null}
          </ItemListItem>
        ))}
      </ItemList>
    )
  }

  function renderThumbView() {
    const hasRows = folders.length > 0 || items.length > 0

    if (!hasRows) {
      return <ItemListEmpty>This folder is empty</ItemListEmpty>
    }

    return (
      <div className="grid flex-1 grid-cols-2 gap-3 overflow-auto sm:grid-cols-3 lg:grid-cols-4">
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            className="glass-card flex flex-col overflow-hidden rounded-lg text-left transition-shadow hover:shadow-[0_2px_8px_hsl(var(--accent-primary)/0.15)]"
            onClick={() => handleFolderOpen(folder)}
            onDoubleClick={() => handleFolderOpen(folder)}
          >
            <div className="flex aspect-square items-center justify-center bg-muted/40">
              <Folder className="h-10 w-10 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-0.5 p-2">
              <p className="truncate text-sm font-medium">{folder.name}</p>
              <p className="text-xs text-muted-foreground">Folder</p>
            </div>
          </button>
        ))}
        {items.map((item) => {
          const isImage = item.mimeType.startsWith('image/')
          const isSelected = selectedIds.has(item.id)

          return (
            <div
              key={item.id}
              className={`glass-card group relative overflow-hidden rounded-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
            >
              <button
                type="button"
                className="flex w-full flex-col text-left"
                onClick={() => handleFileClick(item)}
                onDoubleClick={() => handleFileDoubleClick(item)}
              >
                <div className="aspect-square bg-muted/40">
                  {isImage ? (
                    <img
                      src={item.url}
                      alt={item.fileName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2">
                      <FileIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 p-2">
                  <p className="truncate text-sm font-medium">{item.fileName}</p>
                  {renderFileMeta(item)}
                </div>
              </button>
              {showIconToolbar ? (
                <div className="absolute right-1 top-1">
                  {renderFileMenu(item)}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {showIconToolbar ? (
        <div className="flex shrink-0 items-center gap-1 border-b pb-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Create new folder"
            onClick={() => setCreateFolderOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={viewMode === 'list' ? 'default' : 'outline'}
            aria-label="List view"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={viewMode === 'thumb' ? 'default' : 'outline'}
            aria-label="Thumbnail view"
            onClick={() => setViewMode('thumb')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <nav className="flex shrink-0 flex-wrap items-center gap-1 text-sm text-muted-foreground">
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
      ) : viewMode === 'thumb' && showIconToolbar ? (
        renderThumbView()
      ) : (
        renderListView()
      )}

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={handleCreateFolder}
      />
      <MediaPreviewDialog
        item={previewItem}
        open={previewItem !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null)
        }}
      />
      <MediaDeleteDialog
        open={deleteTarget !== null}
        fileName={deleteTarget?.fileName ?? null}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null)
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
