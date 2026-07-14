import { useEffect, useState } from 'react'
import type { MediaItemDto } from '@webonone/media-embed'
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormField,
  Input,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { getMediaListQueryKey, mediaActions } from '@/features/media/store'
import { FolderTree } from './FolderTree'
import { MediaGrid } from './MediaGrid'
import { UploadDropzone } from './UploadDropzone'
import { createFolder, deleteMediaItem, type MediaFolderDto } from '../services/mediaApi'

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

function validateFolderName(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'Folder name is required'
  }
  if (/[\\/]/.test(trimmed)) {
    return 'Folder name cannot contain slashes'
  }
  return undefined
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
  const dispatch = useAppDispatch()
  const [folderPath, setFolderPath] = useState(initialFolderPath)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderError, setFolderError] = useState<string | undefined>()

  const listQueryKey = getMediaListQueryKey({ scope, folderPath })
  const {
    items,
    folders,
    listError,
    listStatus,
    listQueryKey: storeQueryKey,
    uploadStatus,
    lastUploadedItems,
    lastUploadFailed,
    uploadError,
  } = useAppSelector((s) => s.media)

  const listReady = storeQueryKey === listQueryKey
  const displayItems = listReady ? items : []
  const displayFolders: MediaFolderDto[] = listReady ? folders : []
  const loading = !listReady || listStatus === 'loading' || uploadStatus === 'uploading'

  useEffect(() => {
    dispatch(mediaActions.loadListRequested({ scope, folderPath }))
  }, [dispatch, folderPath, scope])

  useEffect(() => {
    setFolderPath(initialFolderPath)
    setSelectedIds(new Set())
  }, [initialFolderPath, scope])

  useEffect(() => {
    if (!onSelectionChange) {
      return
    }
    const selectedItems = displayItems.filter((item) => selectedIds.has(item.id))
    onSelectionChange(selectedItems)
  }, [displayItems, onSelectionChange, selectedIds])

  useEffect(() => {
    if (uploadStatus === 'uploading') {
      return
    }
    if (uploadStatus === 'error') {
      return
    }
    if (!lastUploadedItems.length && !lastUploadFailed.length) {
      return
    }
    if (lastUploadedItems.length) {
      onUploaded?.(lastUploadedItems)
    }
    dispatch(mediaActions.resetUpload())
  }, [dispatch, lastUploadFailed, lastUploadedItems, onUploaded, uploadStatus])

  useEffect(() => {
    if (!lastUploadFailed.length) {
      return
    }
    setError(lastUploadFailed.map((f) => `${f.fileName}: ${f.reason}`).join('; '))
  }, [lastUploadFailed])

  useEffect(() => {
    if (uploadError) {
      setError(uploadError)
    }
  }, [uploadError])

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

  function handleUpload(files: File[]) {
    setError(null)
    dispatch(
      mediaActions.uploadRequested({
        files: files.slice(0, maxFiles),
        scope,
        folderPath,
      }),
    )
  }

  async function handleDelete(id: string) {
    await deleteMediaItem(id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    onDeleted?.([id])
    dispatch(mediaActions.loadListRequested({ scope, folderPath, force: true }))
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateFolderName(newFolderName)
    if (validationError) {
      setFolderError(validationError)
      return
    }

    const name = newFolderName.trim()
    setFolderError(undefined)
    setError(null)

    try {
      const path = folderPath === '/' ? `/${name}` : `${folderPath}/${name}`
      await createFolder(scope, path, name)
      setNewFolderName('')
      dispatch(mediaActions.loadListRequested({ scope, folderPath, force: true }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
    }
  }

  const displayError = error ?? listError

  return (
    <div className="flex h-full min-h-[400px] gap-4">
      <aside className="w-48 shrink-0 border-r pr-3">
        <FolderTree folders={displayFolders} currentPath={folderPath} onSelectFolder={setFolderPath} />
        <Form className="mt-4 space-y-2" onSubmit={(e) => void handleCreateFolder(e)}>
          <FormField label="New folder" htmlFor="new-folder" error={folderError}>
            <Input
              id="new-folder"
              value={newFolderName}
              onChange={(e) => {
                setNewFolderName(e.target.value)
                if (folderError) {
                  setFolderError(undefined)
                }
              }}
              placeholder="Folder name"
            />
          </FormField>
          <Button type="submit" size="sm" variant="outline" className="w-full">
            Create folder
          </Button>
        </Form>
      </aside>
      <div className="min-w-0 flex-1 space-y-4">
        {displayError ? (
          <Alert variant="destructive">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        ) : null}
        {showUpload ? (
          <UploadDropzone
            accept={accept}
            maxFiles={maxFiles}
            onFilesSelected={handleUpload}
          />
        ) : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading media…</p>
        ) : (
          <MediaGrid
            items={displayItems}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

export type { MediaPickerProps }
