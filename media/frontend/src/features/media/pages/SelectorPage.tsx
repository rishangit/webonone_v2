import { useCallback, useEffect, useRef, useState } from 'react'
import type { MediaItemDto } from '@webonone/media-embed'
import { Button, Callout, CalloutDescription, Spinner } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { mediaActions } from '@/features/media/store'
import { EmbedLayout } from '../components/EmbedLayout'
import { ImageCropDialog } from '../components/ImageCropDialog'
import { ScopedFolderBrowser } from '../components/ScopedFolderBrowser'
import { useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaEmbedAuth } from '../hooks/useMediaEmbedAuth'
import { useMediaParentCommands } from '../hooks/useMediaParentCommands'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'

export function SelectorPage() {
  const dispatch = useAppDispatch()
  const embed = useEmbedMode()
  const { accessToken } = useMediaEmbedAuth(embed)
  const { postSelect, postSelectionChange, postCropRequest } = useMediaPostMessage(
    embed.parentOrigin,
    embed.scope,
  )
  const [selectedItems, setSelectedItems] = useState<MediaItemDto[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentPath, setCurrentPath] = useState(embed.folderPath)
  const uploadPendingRef = useRef(false)

  const { uploadStatus, lastUploadedItems, uploadError: storeUploadError, lastUploadFailed } =
    useAppSelector((s) => s.media)

  const scope = embed.scope ?? 'media:library:default'
  const showUpload = embed.enableSelectorUpload
  // Parent CustomDialog owns Done when embedded.
  const showInlineConfirm = !embed.isEmbed && embed.mode === 'multiple'

  const handleConfirm = useCallback(() => {
    if (selectedItems.length === 0) {
      return
    }
    postSelect(selectedItems)
  }, [postSelect, selectedItems])

  useMediaParentCommands(embed.isEmbed, embed.parentOrigin, handleConfirm)

  useEffect(() => {
    if (!embed.isEmbed) {
      return
    }
    postSelectionChange(selectedItems)
  }, [embed.isEmbed, postSelectionChange, selectedItems])

  useEffect(() => {
    if (!uploadPendingRef.current || uploadStatus === 'uploading') {
      return
    }
    if (uploadStatus === 'error') {
      setUploadError(storeUploadError ?? 'Upload failed')
      uploadPendingRef.current = false
      dispatch(mediaActions.resetUpload())
      return
    }
    if (lastUploadFailed.length) {
      setUploadError(lastUploadFailed.map((f) => `${f.fileName}: ${f.reason}`).join('; '))
    } else {
      setUploadError(null)
      setRefreshKey((key) => key + 1)
      if (embed.mode === 'single' && lastUploadedItems.length) {
        setSelectedItems(lastUploadedItems)
        if (embed.isEmbed) {
          postSelect(lastUploadedItems)
        }
      }
    }
    uploadPendingRef.current = false
    dispatch(mediaActions.resetUpload())
  }, [
    dispatch,
    embed.isEmbed,
    embed.mode,
    lastUploadFailed,
    lastUploadedItems,
    postSelect,
    storeUploadError,
    uploadStatus,
  ])

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

  function toggleItem(item: MediaItemDto) {
    setSelectedItems((prev) => {
      const exists = prev.some((entry) => entry.id === item.id)
      if (exists) {
        return prev.filter((entry) => entry.id !== item.id)
      }
      return [...prev, item]
    })
  }

  function handleSelectFile(item: MediaItemDto) {
    if (embed.mode === 'single') {
      setSelectedItems([item])
      return
    }
    toggleItem(item)
  }

  function uploadFile(file: File) {
    setUploadError(null)
    uploadPendingRef.current = true
    dispatch(
      mediaActions.uploadRequested({
        files: [file],
        scope,
        folderPath: currentPath,
      }),
    )
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

    uploadFile(file)
  }

  async function handleCropConfirm(cropped: File) {
    setCropOpen(false)
    setPendingFile(null)
    uploadFile(cropped)
  }

  const selectedIds = new Set(selectedItems.map((item) => item.id))

  const content = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ScopedFolderBrowser
        scope={scope}
        scopedRoot={embed.scopedRoot}
        initialPath={embed.folderPath}
        mode={embed.mode}
        selectedIds={selectedIds}
        refreshKey={refreshKey}
        onSelectFile={handleSelectFile}
        onToggleSelect={toggleItem}
        onNavigate={setCurrentPath}
        showIconToolbar
        allowDelete
        enableUpload={showUpload}
        uploadAccept="image/*"
        uploadError={uploadError}
        onUploadFiles={showUpload ? handleFilesSelected : undefined}
      />
      {showInlineConfirm ? (
        <div className="flex shrink-0 justify-end border-t pt-3">
          <Button
            type="button"
            disabled={!selectedItems.length}
            onClick={handleConfirm}
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
