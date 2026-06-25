import { useState } from 'react'
import type { MediaItemDto } from '@webonone/media-embed'
import {
  Alert,
  AlertDescription,
  Button,
  Callout,
  CalloutDescription,
  Form,
  FormField,
  Input,
  Spinner,
} from '@webonone/ui-kit'
import { EmbedLayout } from '../components/EmbedLayout'
import { EmbedToolbar } from '../components/EmbedToolbar'
import { ScopedFolderBrowser } from '../components/ScopedFolderBrowser'
import { UploadDropzone } from '../components/UploadDropzone'
import { useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaAuth } from '../hooks/useMediaAuth'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'
import { createFolder, uploadMediaBatch } from '../services/mediaApi'

function validateFolderName(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) return 'Folder name is required'
  if (/[\\/]/.test(trimmed)) return 'Folder name cannot contain slashes'
  return undefined
}

export function FullDialogPage() {
  const embed = useEmbedMode()
  const { accessToken } = useMediaAuth(embed.isEmbed)
  const { postSelect, postCancel } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const [currentPath, setCurrentPath] = useState(embed.folderPath)
  const [selectedItems, setSelectedItems] = useState<MediaItemDto[]>([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderError, setFolderError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [browserKey, setBrowserKey] = useState(0)

  const scope = embed.scope ?? 'media:library:default'

  if (embed.isEmbed && !accessToken) {
    return (
      <EmbedLayout title="Media library" parentOrigin={embed.parentOrigin} chromeless>
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="lg" />
          <Callout variant="muted" className="max-w-sm text-center">
            <CalloutDescription>Waiting for authentication…</CalloutDescription>
          </Callout>
        </div>
      </EmbedLayout>
    )
  }

  function handleToggleSelect(item: MediaItemDto) {
    if (!embed.selectable) return
    setSelectedItems((prev) => {
      const exists = prev.some((p) => p.id === item.id)
      if (exists) {
        return prev.filter((p) => p.id !== item.id)
      }
      return [...prev, item]
    })
  }

  function handleSelectFile(item: MediaItemDto) {
    if (!embed.selectable) return
    if (embed.mode === 'single') {
      postSelect([item])
      return
    }
    handleToggleSelect(item)
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateFolderName(newFolderName)
    if (validationError) {
      setFolderError(validationError)
      return
    }
    const name = newFolderName.trim()
    const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
    setFolderError(undefined)
    setError(null)
    try {
      await createFolder(scope, path, name)
      setNewFolderName('')
      setShowNewFolder(false)
      setBrowserKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
    }
  }

  async function handleUpload(files: File[]) {
    setError(null)
    try {
      await uploadMediaBatch(files, scope, currentPath)
      setShowUpload(false)
      setBrowserKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const selectedIds = new Set(selectedItems.map((item) => item.id))

  const content = (
    <div className="flex h-full min-h-[400px] flex-col gap-3">
      <EmbedToolbar
        onCreateFolder={() => {
          setShowUpload(false)
          setShowNewFolder((v) => !v)
        }}
        onUpload={() => {
          setShowNewFolder(false)
          setShowUpload((v) => !v)
        }}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {showNewFolder ? (
        <Form className="space-y-2 rounded-md border p-3" onSubmit={(e) => void handleCreateFolder(e)}>
          <FormField label="Folder name" htmlFor="dialog-new-folder" error={folderError}>
            <Input
              id="dialog-new-folder"
              value={newFolderName}
              onChange={(e) => {
                setNewFolderName(e.target.value)
                if (folderError) setFolderError(undefined)
              }}
              placeholder="New folder"
            />
          </FormField>
          <Button type="submit" size="sm">
            Create
          </Button>
        </Form>
      ) : null}

      {showUpload ? (
        <UploadDropzone
          accept={embed.accept}
          maxFiles={embed.maxFiles}
          onFilesSelected={handleUpload}
        />
      ) : null}

      <ScopedFolderBrowser
        key={browserKey}
        scope={scope}
        scopedRoot={embed.folderPath}
        mode={embed.selectable ? embed.mode : 'single'}
        selectedIds={selectedIds}
        onSelectFile={embed.selectable ? handleSelectFile : undefined}
        onToggleSelect={embed.selectable ? handleToggleSelect : undefined}
        onNavigate={setCurrentPath}
      />

      {embed.selectable && embed.mode === 'multiple' ? (
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button type="button" variant="outline" onClick={() => postCancel()}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedItems.length}
            onClick={() => postSelect(selectedItems)}
          >
            Confirm ({selectedItems.length})
          </Button>
        </div>
      ) : null}
    </div>
  )

  if (embed.isEmbed) {
    return (
      <EmbedLayout title="Media library" parentOrigin={embed.parentOrigin} chromeless>
        {content}
      </EmbedLayout>
    )
  }

  return <EmbedLayout title="Media library">{content}</EmbedLayout>
}
