import { useCallback, useEffect, useRef, useState } from 'react'
import { FileIcon, Folder, FolderPlus, LayoutGrid, List, Upload } from 'lucide-react'
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
  deleteFolder,
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
  /** Header bar with breadcrumb left, icon toolbar right (selector embed). */
  showIconToolbar?: boolean
  allowDelete?: boolean
  enableUpload?: boolean
  uploadAccept?: string
  uploadError?: string | null
  onUploadFiles?: (files: File[]) => void | Promise<void>
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
  enableUpload = false,
  uploadAccept = 'image/*',
  uploadError = null,
  onUploadFiles,
}: ScopedFolderBrowserProps) {
  const { currentPath, navigateTo, breadcrumbSegments } = useScopedNavigation(scopedRoot)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [folders, setFolders] = useState<MediaFolderDto[]>([])
  const [items, setItems] = useState<MediaItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<BrowserViewMode>('list')
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaItemDto | null>(null)
  const [deleteFileTarget, setDeleteFileTarget] = useState<MediaItemDto | null>(null)
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<MediaFolderDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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

  async function handleConfirmDeleteFile() {
    if (!deleteFileTarget) return
    setIsDeleting(true)
    try {
      await deleteMediaItem(deleteFileTarget.id)
      setDeleteFileTarget(null)
      await loadData()
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleConfirmDeleteFolder() {
    if (!deleteFolderTarget) return
    setIsDeleting(true)
    try {
      await deleteFolder(deleteFolderTarget.id)
      setDeleteFolderTarget(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length || !onUploadFiles) return
    const files = Array.from(fileList)
    setIsUploading(true)
    try {
      await onUploadFiles(files)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
              onClick={() => setDeleteFileTarget(item)}
            >
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  function renderFolderMenu(folder: MediaFolderDto) {
    return (
      <ItemListMenu ariaLabel={`Actions for ${folder.name}`}>
        <DropdownMenuItem onClick={() => handleFolderOpen(folder)}>Open</DropdownMenuItem>
        {allowDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteFolderTarget(folder)}
            >
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  function renderBreadcrumb() {
    return (
      <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbSegments.map((segment, index) => (
          <span key={segment.path} className="flex items-center gap-1">
            {index > 0 ? <span>/</span> : null}
            <button
              type="button"
              className="truncate hover:text-foreground"
              onClick={() => navigateTo(segment.path)}
            >
              {segment.label}
            </button>
          </span>
        ))}
      </nav>
    )
  }

  function renderToolbar() {
    return (
      <div className="flex shrink-0 items-center gap-1">
        {enableUpload ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={uploadAccept}
              multiple={false}
              disabled={isUploading}
              onChange={(e) => void handleFilesSelected(e.target.files)}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Upload file"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </>
        ) : null}
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
    )
  }

  function renderListView() {
    const hasRows = folders.length > 0 || items.length > 0

    if (!hasRows) {
      return (
        <ItemListEmpty>
          {enableUpload
            ? 'This folder is empty. Drag files here or use Upload.'
            : 'This folder is empty'}
        </ItemListEmpty>
      )
    }

    return (
      <ItemList className="min-h-0 flex-1 overflow-auto scrollbar-themed">
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
            {showIconToolbar ? renderFolderMenu(folder) : null}
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
      return (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
          {enableUpload
            ? 'This folder is empty. Drag files here or use Upload.'
            : 'This folder is empty'}
        </div>
      )
    }

    return (
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 overflow-auto scrollbar-themed sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="glass-card group relative overflow-hidden rounded-lg"
          >
            <button
              type="button"
              className="flex w-full flex-col text-left"
              onClick={() => handleFolderOpen(folder)}
              onDoubleClick={() => handleFolderOpen(folder)}
            >
              <div className="flex aspect-square items-center justify-center bg-muted/40 p-3">
                <Folder className="h-8 w-8 text-muted-foreground sm:h-6 sm:w-6" aria-hidden />
              </div>
              <div className="space-y-0.5 p-1.5">
                <p className="truncate text-xs font-medium sm:text-sm">{folder.name}</p>
                <p className="text-xs text-muted-foreground">Folder</p>
              </div>
            </button>
            {showIconToolbar ? (
              <div className="absolute right-1 top-1">
                {renderFolderMenu(folder)}
              </div>
            ) : null}
          </div>
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
                      <FileIcon className="h-6 w-6 text-muted-foreground sm:h-5 sm:w-5" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 p-1.5">
                  <p className="truncate text-xs font-medium sm:text-sm">{item.fileName}</p>
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

  const dropZoneEnabled = enableUpload && Boolean(onUploadFiles)

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {showIconToolbar ? (
        <header className="flex shrink-0 flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {renderBreadcrumb()}
          {renderToolbar()}
        </header>
      ) : (
        renderBreadcrumb()
      )}

      {uploadError ? <p className="shrink-0 text-sm text-destructive">{uploadError}</p> : null}

      {error ? (
        <Alert variant="destructive" className="shrink-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-md transition-colors ${
          dropZoneEnabled && isDragging ? 'bg-primary/5 ring-2 ring-primary/30' : ''
        }`}
        onDragOver={(e) => {
          if (!dropZoneEnabled || isUploading) return
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          if (!dropZoneEnabled || isUploading) return
          e.preventDefault()
          setIsDragging(false)
          void handleFilesSelected(e.dataTransfer.files)
        }}
      >
        {loading || isUploading ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <Spinner />
          </div>
        ) : viewMode === 'thumb' && showIconToolbar ? (
          renderThumbView()
        ) : (
          renderListView()
        )}
      </div>

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
        open={deleteFileTarget !== null}
        fileName={deleteFileTarget?.fileName ?? null}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteFileTarget(null)
        }}
        onConfirm={() => void handleConfirmDeleteFile()}
      />
      <MediaDeleteDialog
        open={deleteFolderTarget !== null}
        fileName={deleteFolderTarget?.name ?? null}
        title="Delete folder"
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteFolderTarget(null)
        }}
        onConfirm={() => void handleConfirmDeleteFolder()}
      />
    </div>
  )
}
