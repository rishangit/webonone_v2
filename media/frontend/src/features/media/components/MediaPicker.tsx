import { useCallback, useEffect, useState } from 'react'
import type { MediaItemDto } from '@webonone/media-embed'
import { Button } from '@webonone/ui-kit'
import { FolderTree } from './FolderTree'
import { MediaGrid } from './MediaGrid'
import { UploadDropzone } from './UploadDropzone'
import {
  createFolder,
  deleteMediaItem,
  listFolders,
  listMediaItems,
  uploadMediaBatch,
  type MediaFolderDto,
} from '../services/mediaApi'

interface MediaPickerProps {
  scope: string
  folderPath: string
  accept: string
  maxFiles: number
  mode: 'single' | 'multiple'
  onSelectionChange?: (items: MediaItemDto[]) => void
  onUploaded?: (items: MediaItemDto[]) => void
  onDeleted?: (ids: string[]) => void
  showUpload?: boolean
}

export function MediaPicker({
  scope,
  folderPath: initialFolderPath,
  accept,
  maxFiles,
  mode,
  onSelectionChange,
  onUploaded,
  onDeleted,
  showUpload = true,
}: MediaPickerProps) {
  const [folderPath, setFolderPath] = useState(initialFolderPath)
  const [folders, setFolders] = useState<MediaFolderDto[]>([])
  const [items, setItems] = useState<MediaItemDto[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const [mediaResult, folderResult] = await Promise.all([
        listMediaItems({ scope, folderPath }),
        listFolders(scope, folderPath),
      ])
      setItems(mediaResult.items)
      setFolders(folderResult.folders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
    }
  }, [folderPath, scope])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    setFolderPath(initialFolderPath)
    setSelectedIds(new Set())
  }, [initialFolderPath, scope])

  useEffect(() => {
    if (!onSelectionChange) {
      return
    }
    const selectedItems = items.filter((item) => selectedIds.has(item.id))
    onSelectionChange(selectedItems)
  }, [items, onSelectionChange, selectedIds])

  function toggleSelect(item: MediaItemDto) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (mode === 'single') {
        next.clear()
        next.add(item.id)
      } else if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.add(item.id)
      }
      return next
    })
  }

  async function handleUpload(files: File[]) {
    const result = await uploadMediaBatch(files.slice(0, maxFiles), scope, folderPath)
    if (result.failed.length) {
      setError(result.failed.map((f) => `${f.fileName}: ${f.reason}`).join('; '))
    }
    if (result.items.length) {
      onUploaded?.(result.items)
      await loadData()
    }
  }

  async function handleDelete(id: string) {
    await deleteMediaItem(id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    onDeleted?.([id])
    await loadData()
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name) return
    const path = folderPath === '/' ? `/${name}` : `${folderPath}/${name}`
    await createFolder(scope, path, name)
    setNewFolderName('')
    await loadData()
  }

  return (
    <div className="flex h-full min-h-[400px] gap-4">
      <aside className="w-40 shrink-0 border-r pr-3">
        <FolderTree folders={folders} currentPath={folderPath} onSelectFolder={setFolderPath} />
        <div className="mt-4 space-y-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder"
            className="w-full rounded border px-2 py-1 text-xs"
          />
          <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => void handleCreateFolder()}>
            Create folder
          </Button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {showUpload && (
          <UploadDropzone
            accept={accept}
            maxFiles={maxFiles}
            onFilesSelected={handleUpload}
          />
        )}
        <MediaGrid
          items={items}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDelete={(id) => void handleDelete(id)}
        />
      </div>
    </div>
  )
}

export type { MediaPickerProps }
