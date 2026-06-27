import { useState } from 'react'
import type { MediaItemDto } from '@webonone/media-embed'
import { Button, Callout, CalloutDescription, Spinner } from '@webonone/ui-kit'
import { EmbedLayout } from '../components/EmbedLayout'
import { ImageCropDialog } from '../components/ImageCropDialog'
import { ScopedFolderBrowser } from '../components/ScopedFolderBrowser'
import { useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaAuth } from '../hooks/useMediaAuth'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'
import { useScopedNavigation } from '../hooks/useScopedNavigation'
import { uploadMediaFile } from '../services/mediaApi'

export function SelectorPage() {
  const embed = useEmbedMode()
  const { accessToken } = useMediaAuth(embed.isEmbed)
  const { postSelect, postCropRequest } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const [selectedItems, setSelectedItems] = useState<MediaItemDto[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { currentPath } = useScopedNavigation(embed.folderPath)

  const scope = embed.scope ?? 'media:library:default'
  const showUpload = embed.enableSelectorUpload

  if (embed.isEmbed && !accessToken) {
    return (
      <EmbedLayout title="" parentOrigin={embed.parentOrigin} chromeless inset>
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="lg" />
          <Callout variant="muted" className="max-w-sm text-center">
            <CalloutDescription>Waiting for authentication…</CalloutDescription>
          </Callout>
        </div>
      </EmbedLayout>
    )
  }

  function handleSelectFile(item: MediaItemDto) {
    if (embed.mode === 'single') {
      if (embed.isEmbed) {
        postSelect([item])
      }
      return
    }
    setSelectedItems((prev) => {
      const exists = prev.some((p) => p.id === item.id)
      if (exists) {
        return prev.filter((p) => p.id !== item.id)
      }
      return [...prev, item]
    })
  }

  function handleToggleSelect(item: MediaItemDto) {
    setSelectedItems((prev) => {
      const exists = prev.some((p) => p.id === item.id)
      if (exists) {
        return prev.filter((p) => p.id !== item.id)
      }
      return [...prev, item]
    })
  }

  function handleConfirmMultiple() {
    if (embed.isEmbed && selectedItems.length) {
      postSelect(selectedItems)
    }
  }

  async function uploadFile(file: File) {
    setUploadError(null)
    try {
      const result = await uploadMediaFile(file, scope, currentPath)
      setRefreshKey((key) => key + 1)
      if (embed.mode === 'single' && embed.isEmbed) {
        postSelect([result.item])
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  async function handleFilesSelected(files: File[]) {
    const file = files[0]
    if (!file) return

    if (showUpload && file.type.startsWith('image/')) {
      if (embed.isEmbed) {
        postCropRequest({
          file,
          folderPath: currentPath,
          cropAspectPresets: embed.cropAspectPresets ?? undefined,
        })
        return
      }
      setPendingFile(file)
      setCropOpen(true)
      return
    }

    await uploadFile(file)
  }

  async function handleCropConfirm(cropped: File) {
    setCropOpen(false)
    setPendingFile(null)
    await uploadFile(cropped)
  }

  const selectedIds = new Set(selectedItems.map((item) => item.id))

  const content = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ScopedFolderBrowser
        scope={scope}
        scopedRoot={embed.folderPath}
        mode={embed.mode}
        selectedIds={selectedIds}
        refreshKey={refreshKey}
        onSelectFile={handleSelectFile}
        onToggleSelect={handleToggleSelect}
        showIconToolbar
        allowDelete
        enableUpload={showUpload}
        uploadAccept="image/*"
        uploadError={uploadError}
        onUploadFiles={showUpload ? handleFilesSelected : undefined}
      />
      {embed.mode === 'multiple' ? (
        <div className="flex shrink-0 justify-end border-t pt-3">
          <Button
            type="button"
            disabled={!selectedItems.length}
            onClick={handleConfirmMultiple}
          >
            Confirm ({selectedItems.length})
          </Button>
        </div>
      ) : null}
    </div>
  )

  return (
    <>
      <EmbedLayout
        title=""
        chromeless
        inset
        parentOrigin={embed.isEmbed ? embed.parentOrigin : undefined}
      >
        {content}
      </EmbedLayout>
      <ImageCropDialog
        open={cropOpen}
        file={pendingFile}
        defaultAspect={embed.cropAspectPresets?.[0] ?? '1:1'}
        aspectPresets={embed.cropAspectPresets ?? undefined}
        onConfirm={(file) => void handleCropConfirm(file)}
        onCancel={() => {
          setCropOpen(false)
          setPendingFile(null)
        }}
      />
    </>
  )
}
