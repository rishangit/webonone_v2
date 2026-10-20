import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Check, FileIcon, Folder, FolderPlus, LayoutGrid, List, Upload } from 'lucide-react'
import type { MediaItemDto } from '@webonone/media-embed'
import {
  Alert,
  AlertDescription,
  Button,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FormField,
  CollectionListView,
  ImagePreview,
  ItemListCollectionCard,
  itemListCardImageClassName,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListViewToggle,
  itemListRowActiveClassName,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageActions,
  ListPageBody,
  SearchInput,
  LoadingState,
  ListDisplayModeProvider,
  ListPageFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@webonone/ui-kit'
import { useListDisplayModeControl } from '@/shared/hooks/useListDisplayModeControl'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { getMediaListQueryKey, mediaActions } from '@/features/media/store'
import { CreateFolderDialog } from './CreateFolderDialog'
import { MediaPreviewDialog } from './MediaPreviewDialog'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import { useScopedNavigation } from '../hooks/useScopedNavigation'
import {
  createFolder,
  deleteFolder,
  deleteMediaItem,
  moveMediaFolder,
  moveMediaItem,
  type MediaFolderDto,
} from '../services/mediaApi'
import { beginMediaDrag, canDropMediaOnFolder, endMediaDrag, readMediaDrag } from '../utils/mediaDrag'
import { formatFileSize, formatMediaDate } from '../utils/formatMedia'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'

type BrowserViewMode = 'list' | 'thumb'

interface ScopedFolderBrowserProps {
  scope: string
  scopedRoot: string
  /** Start folder within scopedRoot. Defaults to scopedRoot. */
  initialPath?: string
  mode: 'single' | 'multiple'
  selectedIds?: Set<string>
  refreshKey?: number
  onSelectFile?: (item: MediaItemDto) => void
  onToggleSelect?: (item: MediaItemDto) => void
  onNavigate?: (path: string) => void
  /** Header bar with breadcrumb left, icon toolbar right (selector embed). */
  showIconToolbar?: boolean
  /**
   * When false, the toolbar offers list and card only (add-media dialogs).
   * The library keeps list, grid, and card.
   */
  gridLayout?: boolean
  allowDelete?: boolean
  enableUpload?: boolean
  uploadAccept?: string
  uploadError?: string | null
  onUploadFiles?: (files: File[]) => void | Promise<void>
  /** When true, report loading via AppLayout overlay instead of inline LoadingState. */
  hostLoading?: boolean
  /** Set when this browser is inside a parent iframe so New folder opens there. */
  parentOrigin?: string | null
  /** Website media page: the page scrolls the list instead of a nested scroller. */
  pageScroll?: boolean
}

function companyRootLabel(scope: string, scopedRoot: string): string {
  if (scopedRoot === '/' && scope.startsWith('webonone:company:')) {
    return 'Company'
  }
  return 'Root'
}

export function ScopedFolderBrowser({
  scope,
  scopedRoot,
  initialPath,
  mode,
  selectedIds = new Set(),
  refreshKey = 0,
  onSelectFile,
  onToggleSelect,
  onNavigate,
  showIconToolbar = false,
  gridLayout = true,
  allowDelete = false,
  enableUpload = false,
  uploadAccept = 'image/*',
  uploadError = null,
  onUploadFiles,
  hostLoading = false,
  parentOrigin = null,
  pageScroll = false,
}: ScopedFolderBrowserProps) {
  const dispatch = useAppDispatch()
  const rootLabel = companyRootLabel(scope, scopedRoot)
  const { currentPath, navigateTo, breadcrumbSegments } = useScopedNavigation(
    scopedRoot,
    initialPath,
    rootLabel,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mediaPage, setMediaPage] = useState(1)
  const [mediaPageSize, setMediaPageSize] = useState(12)
  const [listScrollRoot, setListScrollRoot] = useState<HTMLDivElement | null>(null)
  const [viewMode, setViewMode] = useState<BrowserViewMode>('thumb')
  const { mode: listDisplayMode, setMode: setListDisplayMode } = useListDisplayModeControl()
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaItemDto | null>(null)
  const [deleteFileTarget, setDeleteFileTarget] = useState<MediaItemDto | null>(null)
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<MediaFolderDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [dropTargetPath, setDropTargetPath] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [fileNameQuery, setFileNameQuery] = useState('')
  const [mimeFilter, setMimeFilter] = useState<'all' | 'image' | 'other'>('all')

  const {
    items,
    folders,
    total,
    page: storePage,
    listError,
    listStatus,
    listQueryKey: storeQueryKey,
  } = useAppSelector((s) => s.media)

  const listQueryKey = getMediaListQueryKey({
    scope,
    folderPath: currentPath,
    page: storePage,
    pageSize: mediaPageSize,
  })

  const listReady = storeQueryKey === listQueryKey
  const loading = !listReady || (listStatus === 'loading' && items.length === 0)
  const loadingMore = listStatus === 'loading' && items.length > 0
  const error = localError ?? (listReady ? listError : null)
  const mediaTotal = listReady ? total : 0
  const loadingLabel = isMoving ? 'Moving…' : isUploading ? 'Uploading…' : loading ? 'Loading media…' : null

  usePlatformLoading(loadingLabel, hostLoading)

  const showListContent = !loading && !isUploading

  const hasActiveFilters = mimeFilter !== 'all'

  const filteredFolders = useMemo(() => {
    const query = fileNameQuery.trim().toLowerCase()
    if (!query) return listReady ? folders : []
    return folders.filter((folder) => folder.name.toLowerCase().includes(query))
  }, [folders, fileNameQuery, listReady])

  const filteredItems = useMemo(() => {
    let result = listReady ? items : []
    const query = fileNameQuery.trim().toLowerCase()
    if (query) {
      result = result.filter((item) => item.fileName.toLowerCase().includes(query))
    }
    if (mimeFilter === 'image') {
      result = result.filter((item) => item.mimeType.startsWith('image/'))
    } else if (mimeFilter === 'other') {
      result = result.filter((item) => !item.mimeType.startsWith('image/'))
    }
    return result
  }, [items, fileNameQuery, listReady, mimeFilter])

  const loadList = useCallback(
    (nextPage: number, nextPageSize: number, append = false, force = false) => {
      dispatch(
        mediaActions.loadListRequested({
          scope,
          folderPath: currentPath,
          page: nextPage,
          pageSize: nextPageSize,
          append,
          force,
        }),
      )
    },
    [currentPath, dispatch, scope],
  )

  useEffect(() => {
    setMediaPage(1)
    loadList(1, mediaPageSize, false, refreshKey > 0)
  }, [currentPath, refreshKey, loadList, mediaPageSize])

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
    dispatch(
      mediaActions.loadListRequested({
        scope,
        folderPath: currentPath,
        page: mediaPage,
        pageSize: mediaPageSize,
        force: true,
      }),
    )
  }

  async function handleConfirmDeleteFile() {
    if (!deleteFileTarget) return
    setIsDeleting(true)
    try {
      await deleteMediaItem(deleteFileTarget.id)
      setDeleteFileTarget(null)
      dispatch(
        mediaActions.loadListRequested({
          scope,
          folderPath: currentPath,
          page: mediaPage,
          pageSize: mediaPageSize,
          force: true,
        }),
      )
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
      dispatch(
        mediaActions.loadListRequested({
          scope,
          folderPath: currentPath,
          page: mediaPage,
          pageSize: mediaPageSize,
          force: true,
        }),
      )
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to delete folder')
    } finally {
      setIsDeleting(false)
    }
  }

  function clearDrag() {
    endMediaDrag()
    setDropTargetPath(null)
  }

  function handleDragStart(
    event: DragEvent,
    payload: { kind: 'file' | 'folder'; id: string; path: string; name: string },
  ) {
    beginMediaDrag(payload)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', payload.name)
    event.stopPropagation()
  }

  function handleFolderDragOver(event: DragEvent, path: string) {
    if (!canDropMediaOnFolder(path, scopedRoot)) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    setDropTargetPath(path)
  }

  function handleFolderDragLeave(event: DragEvent, path: string) {
    event.stopPropagation()
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setDropTargetPath((current) => (current === path ? null : current))
  }

  async function handleFolderDrop(event: DragEvent, path: string) {
    event.preventDefault()
    event.stopPropagation()
    const drag = readMediaDrag()
    const allowed = canDropMediaOnFolder(path, scopedRoot)
    clearDrag()
    if (!drag || !allowed || isMoving) return
    setIsMoving(true)
    setLocalError(null)
    try {
      if (drag.kind === 'file') {
        await moveMediaItem(drag.id, path)
      } else {
        await moveMediaFolder({ scope, fromPath: drag.path, toParentPath: path })
      }
      setMediaPage(1)
      loadList(1, mediaPageSize, false, true)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to move')
    } finally {
      setIsMoving(false)
    }
  }

  function folderDropHandlers(path: string) {
    return {
      onDragOver: (event: DragEvent) => handleFolderDragOver(event, path),
      onDragLeave: (event: DragEvent) => handleFolderDragLeave(event, path),
      onDrop: (event: DragEvent) => void handleFolderDrop(event, path),
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
    const canDeleteFolder = allowDelete && !folder.id.startsWith('inferred:')
    return (
      <ItemListMenu ariaLabel={`Actions for ${folder.name}`}>
        <DropdownMenuItem onClick={() => handleFolderOpen(folder)}>Open</DropdownMenuItem>
        {canDeleteFolder ? (
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
      <nav className="flex w-full min-w-0 flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbSegments.map((segment, index) => (
          <span key={segment.path} className="flex items-center gap-1">
            {index > 0 ? <span>/</span> : null}
            <button
              type="button"
              className={`truncate hover:text-foreground ${
                dropTargetPath === segment.path ? 'rounded-sm ring-2 ring-primary' : ''
              }`}
              onClick={() => navigateTo(segment.path)}
              {...folderDropHandlers(segment.path)}
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
      <ListPageActions className="w-full min-w-0 max-w-full">
        <SearchInput
          value={fileNameQuery}
          onChange={(event) => setFileNameQuery(event.target.value)}
          onClear={() => setFileNameQuery('')}
          placeholder="File or folder name"
          aria-label="Search files and folders"
          className="w-full min-w-0 max-w-64"
        />
        <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
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
              className="h-9 w-9 shrink-0"
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
          className="h-9 w-9 shrink-0"
          onClick={() => setCreateFolderOpen(true)}
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
        {gridLayout ? (
          <>
            <Button
              type="button"
              size="icon"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              aria-label="List view"
              className="h-9 w-9 shrink-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={viewMode === 'thumb' ? 'default' : 'outline'}
              aria-label="Thumbnail view"
              className="h-9 w-9 shrink-0"
              onClick={() => setViewMode('thumb')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </>
        ) : null}
        <ItemListViewToggle
          value={listDisplayMode}
          onChange={setListDisplayMode}
          gridLayout={gridLayout}
        />
      </ListPageActions>
    )
  }

  function renderListView() {
    const hasRows = filteredFolders.length > 0 || filteredItems.length > 0

    if (!hasRows) {
      return (
        <ItemListEmpty>
          {enableUpload
            ? 'This folder is empty. Drag files here or use Upload.'
            : 'This folder is empty.'}
        </ItemListEmpty>
      )
    }

    type BrowserRow =
      | { kind: 'folder'; id: string; folder: MediaFolderDto }
      | { kind: 'file'; id: string; item: MediaItemDto }

    const rows: BrowserRow[] = [
      ...filteredFolders.map((folder) => ({ kind: 'folder' as const, id: folder.id, folder })),
      ...filteredItems.map((item) => ({ kind: 'file' as const, id: item.id, item })),
    ]

    const columns = [
      {
        id: 'name',
        header: 'Name',
        sortable: true,
        compare: (a: BrowserRow, b: BrowserRow) => {
          const nameA = a.kind === 'folder' ? a.folder.name : a.item.fileName
          const nameB = b.kind === 'folder' ? b.folder.name : b.item.fileName
          return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })
        },
        cell: (row: BrowserRow) =>
          row.kind === 'folder' ? row.folder.name : row.item.fileName,
      },
    ]

    return (
      <CollectionListView
        items={rows}
        getRowKey={(row) => row.id}
        gridLayout={gridLayout}
        columns={columns}
        empty={
          <ItemListEmpty>
            {enableUpload
              ? 'This folder is empty. Drag files here or use Upload.'
              : 'This folder is empty.'}
          </ItemListEmpty>
        }
        renderGridActions={(row) =>
          row.kind === 'folder'
            ? showIconToolbar
              ? renderFolderMenu(row.folder)
              : null
            : showIconToolbar
              ? renderFileMenu(row.item)
              : null
        }
        renderListItem={(row) => {
          if (row.kind === 'folder') {
            return (
              <ItemListItem
                draggable
                className={cn(
                  'cursor-grab active:cursor-grabbing',
                  dropTargetPath === row.folder.path && 'ring-2 ring-primary',
                )}
                onDragStart={(event) =>
                  handleDragStart(event, {
                    kind: 'folder',
                    id: row.folder.id,
                    path: row.folder.path,
                    name: row.folder.name,
                  })
                }
                onDragEnd={clearDrag}
                {...folderDropHandlers(row.folder.path)}
              >
                <ItemListContent>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 text-left text-sm"
                    onClick={() => handleFolderOpen(row.folder)}
                    onDoubleClick={() => handleFolderOpen(row.folder)}
                  >
                    <Folder className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate font-medium">{row.folder.name}</span>
                  </button>
                </ItemListContent>
                {showIconToolbar ? renderFolderMenu(row.folder) : null}
              </ItemListItem>
            )
          }
          const isSelected = selectedIds.has(row.item.id)
          return (
            <ItemListItem
              draggable
              className={cn(
                'cursor-grab active:cursor-grabbing',
                isSelected && itemListRowActiveClassName,
              )}
              aria-selected={isSelected}
              onDragStart={(event) =>
                handleDragStart(event, {
                  kind: 'file',
                  id: row.item.id,
                  path: currentPath,
                  name: row.item.fileName,
                })
              }
              onDragEnd={clearDrag}
            >
              <ItemListContent>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 text-left text-sm"
                  onClick={() => handleFileClick(row.item)}
                  onDoubleClick={() => handleFileDoubleClick(row.item)}
                >
                  <FileIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{row.item.fileName}</span>
                    {renderFileMeta(row.item)}
                  </span>
                </button>
              </ItemListContent>
              {isSelected ? (
                <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden />
              ) : null}
              {showIconToolbar ? renderFileMenu(row.item) : null}
            </ItemListItem>
          )
        }}
        renderCard={(row) => {
          if (row.kind === 'folder') {
            return (
              <div
                draggable
                className={cn(
                  'cursor-grab rounded-lg active:cursor-grabbing',
                  dropTargetPath === row.folder.path && 'ring-2 ring-primary',
                )}
                onDragStart={(event) =>
                  handleDragStart(event, {
                    kind: 'folder',
                    id: row.folder.id,
                    path: row.folder.path,
                    name: row.folder.name,
                  })
                }
                onDragEnd={clearDrag}
                {...folderDropHandlers(row.folder.path)}
              >
              <ItemListCollectionCard
                image={
                  <div className="flex h-full w-full items-center justify-center bg-muted/40">
                    <Folder className="h-10 w-10 text-muted-foreground" aria-hidden />
                  </div>
                }
                menu={showIconToolbar ? renderFolderMenu(row.folder) : undefined}
                onBodyClick={() => handleFolderOpen(row.folder)}
              >
                <p className="line-clamp-2 min-w-0 break-words font-medium">{row.folder.name}</p>
                <p className="text-xs text-muted-foreground">Folder</p>
              </ItemListCollectionCard>
              </div>
            )
          }
          const isSelected = selectedIds.has(row.item.id)
          const isImage = row.item.mimeType.startsWith('image/')
          return (
            <div
              draggable
              className="cursor-grab rounded-lg active:cursor-grabbing"
              onDragStart={(event) =>
                handleDragStart(event, {
                  kind: 'file',
                  id: row.item.id,
                  path: currentPath,
                  name: row.item.fileName,
                })
              }
              onDragEnd={clearDrag}
            >
            <ItemListCollectionCard
              className={cn(isSelected && itemListRowActiveClassName)}
              image={
                isImage ? (
                  <ImagePreview
                    src={row.item.url}
                    alt={row.item.fileName}
                    className={itemListCardImageClassName}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/40">
                    <FileIcon className="h-10 w-10 text-muted-foreground" aria-hidden />
                  </div>
                )
              }
              menu={showIconToolbar ? renderFileMenu(row.item) : undefined}
              onBodyClick={() => handleFileClick(row.item)}
            >
              <p className="line-clamp-2 min-w-0 break-words font-medium">{row.item.fileName}</p>
              {renderFileMeta(row.item)}
              {isSelected ? (
                <Check className="mt-2 h-5 w-5 text-primary" aria-hidden />
              ) : null}
            </ItemListCollectionCard>
            </div>
          )
        }}
      />
    )
  }

  function renderThumbView() {
    const hasRows = filteredFolders.length > 0 || filteredItems.length > 0

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
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6">
        {filteredFolders.map((folder) => (
          <div
            key={folder.id}
            draggable
            className={cn(
              'glass-card group relative cursor-grab overflow-hidden rounded-lg active:cursor-grabbing',
              dropTargetPath === folder.path && 'ring-2 ring-primary',
            )}
            onDragStart={(event) =>
              handleDragStart(event, {
                kind: 'folder',
                id: folder.id,
                path: folder.path,
                name: folder.name,
              })
            }
            onDragEnd={clearDrag}
            {...folderDropHandlers(folder.path)}
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
        {filteredItems.map((item) => {
          const isImage = item.mimeType.startsWith('image/')
          const isSelected = selectedIds.has(item.id)

          return (
            <div
              key={item.id}
              draggable
              className={cn(
                'glass-card group relative cursor-grab overflow-hidden rounded-lg active:cursor-grabbing',
                isSelected && 'ring-2 ring-primary',
              )}
              onDragStart={(event) =>
                handleDragStart(event, {
                  kind: 'file',
                  id: item.id,
                  path: currentPath,
                  name: item.fileName,
                })
              }
              onDragEnd={clearDrag}
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
                      draggable={false}
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
              {isSelected ? (
                <Check
                  className="pointer-events-none absolute bottom-8 right-1.5 h-5 w-5 rounded-full bg-background/90 p-0.5 text-primary shadow-sm"
                  aria-hidden
                />
              ) : null}
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
    <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-2">
      <ListFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApply={() => setMediaPage(1)}
        onClear={() => {
          setMimeFilter('all')
          setMediaPage(1)
        }}
      >
        <FormField label="Type" htmlFor="media-mime-filter">
          <Select value={mimeFilter} onValueChange={(value) => setMimeFilter(value as 'all' | 'image' | 'other')}>
            <SelectTrigger id="media-mime-filter">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="other">Other files</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </ListFilterPanel>

      {showIconToolbar ? (
        <header className="flex w-full min-w-0 shrink-0 flex-col gap-2 border-b pb-2">
          {renderBreadcrumb()}
          {renderToolbar()}
        </header>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-2">
          {renderBreadcrumb()}
          <ListPageActions className="w-full min-w-0 max-w-full">
            <SearchInput
              value={fileNameQuery}
              onChange={(event) => setFileNameQuery(event.target.value)}
              onClear={() => setFileNameQuery('')}
              placeholder="File or folder name"
              aria-label="Search files and folders"
              className="w-full min-w-0 max-w-64"
            />
            <ListFilterTrigger active={hasActiveFilters} onClick={() => setFilterOpen(true)} />
          </ListPageActions>
        </div>
      )}

      {uploadError ? <p className="shrink-0 text-sm text-destructive">{uploadError}</p> : null}

      {error ? (
        <Alert variant="destructive" className="shrink-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody className="min-h-0 flex-1">
        <div
          ref={setListScrollRoot}
          className={`flex flex-col rounded-md transition-colors ${
            pageScroll ? 'min-h-0' : 'min-h-0 flex-1 overflow-auto scrollbar-themed'
          } ${dropZoneEnabled && isDragging ? 'bg-primary/5 ring-2 ring-primary/30' : ''}`}
          onDragOver={(e) => {
            if (readMediaDrag() || !dropZoneEnabled || isUploading) return
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            if (readMediaDrag() || !dropZoneEnabled || isUploading) return
            e.preventDefault()
            setIsDragging(false)
            void handleFilesSelected(e.dataTransfer.files)
          }}
        >
          {!hostLoading && (loading || isUploading) ? (
            <LoadingState
              overlay
              label={isUploading ? 'Uploading…' : 'Loading media…'}
            />
          ) : null}
          {showListContent ? (
            <ListDisplayModeProvider mode={listDisplayMode}>
              {gridLayout && viewMode === 'thumb' && showIconToolbar
                ? renderThumbView()
                : renderListView()}
            </ListDisplayModeProvider>
          ) : null}
        </div>

        {showListContent ? (
          <ListPageFooter
            className="mt-auto shrink-0"
            totalCount={mediaTotal}
            currentPage={mediaPage}
            pageSize={mediaPageSize}
            pageSizeOptions={[12, 24, 48]}
            loadedCount={items.length}
            hasMore={items.length < mediaTotal}
            loadingMore={loadingMore}
            scrollRoot={listScrollRoot}
            onPageChange={(nextPage) => {
              setMediaPage(nextPage)
              loadList(nextPage, mediaPageSize)
            }}
            onPageSizeChange={(nextSize) => {
              setMediaPageSize(nextSize)
              setMediaPage(1)
              loadList(1, nextSize)
            }}
            onLoadMore={() => {
              const nextPage = mediaPage + 1
              setMediaPage(nextPage)
              loadList(nextPage, mediaPageSize, true)
            }}
            onModeChange={() => {
              setMediaPage(1)
              loadList(1, mediaPageSize)
            }}
          />
        ) : null}
      </ListPageBody>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={handleCreateFolder}
        parentOrigin={parentOrigin}
        scope={scope}
        folderPath={currentPath}
        onHostedCreated={() => {
          dispatch(
            mediaActions.loadListRequested({
              scope,
              folderPath: currentPath,
              page: mediaPage,
              pageSize: mediaPageSize,
              force: true,
            }),
          )
        }}
      />
      <MediaPreviewDialog
        item={previewItem}
        open={previewItem !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null)
        }}
      />
      <PlatformAlertConfirmDialog
        open={deleteFileTarget !== null}
        title={deleteFileTarget ? `Delete ${deleteFileTarget.fileName}?` : 'Delete media?'}
        description="This action cannot be undone. The file will be permanently removed."
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteFileTarget(null)
        }}
        onConfirm={() => void handleConfirmDeleteFile()}
      />
      <PlatformAlertConfirmDialog
        open={deleteFolderTarget !== null}
        title={deleteFolderTarget ? `Delete ${deleteFolderTarget.name}?` : 'Delete folder?'}
        description="This action cannot be undone. The folder will be permanently removed."
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteFolderTarget(null)
        }}
        onConfirm={() => void handleConfirmDeleteFolder()}
      />
    </div>
  )
}
