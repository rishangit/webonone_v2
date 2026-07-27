import { useEffect, useRef } from 'react'
import { Callout, CalloutDescription, Spinner } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { mediaActions } from '@/features/media/store'
import { EmbedLayout } from '../components/EmbedLayout'
import { ImageCropDialog, type ImageCropDialogHandle } from '../components/ImageCropDialog'
import { useEmbedDocumentFill } from '../hooks/useEmbedDocumentFill'
import { useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaEmbedAuth } from '../hooks/useMediaEmbedAuth'
import { useMediaCropInit } from '../hooks/useMediaCropInit'
import { useMediaParentCommands } from '../hooks/useMediaParentCommands'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'

export function CropDialogPage() {
  const dispatch = useAppDispatch()
  const embed = useEmbedMode()
  const cropRef = useRef<ImageCropDialogHandle>(null)
  useEmbedDocumentFill(embed.isEmbed)
  // Attach CROP_INIT listener before auth READY so the first deliverInit is not dropped.
  const { pendingFile, defaultAspect, aspectPresets, clearPending } = useMediaCropInit(
    embed.isEmbed,
    embed.parentOrigin,
  )
  const { accessToken } = useMediaEmbedAuth(embed)
  const { postSelect, postCancel } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const uploadPendingRef = useRef(false)

  const { uploadStatus, lastUploadedItems } = useAppSelector((s) => s.media)

  const scope = embed.scope ?? 'media:library:default'
  const folderPath = embed.folderPath ?? '/'

  useMediaParentCommands(embed.isEmbed, embed.parentOrigin, () => {
    void cropRef.current?.confirm()
  })

  useEffect(() => {
    if (!uploadPendingRef.current || uploadStatus === 'uploading') {
      return
    }
    if (lastUploadedItems.length && embed.isEmbed) {
      postSelect(lastUploadedItems)
    }
    uploadPendingRef.current = false
    dispatch(mediaActions.resetUpload())
  }, [dispatch, embed.isEmbed, lastUploadedItems, postSelect, uploadStatus])

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

  function uploadFile(file: File) {
    uploadPendingRef.current = true
    dispatch(
      mediaActions.uploadRequested({
        files: [file],
        scope,
        folderPath,
      }),
    )
  }

  async function handleCropConfirm(cropped: File) {
    clearPending()
    uploadFile(cropped)
  }

  function handleCropCancel() {
    clearPending()
    if (embed.isEmbed) {
      postCancel()
    }
  }

  if (embed.isEmbed && !pendingFile) {
    return (
      <EmbedLayout title="" parentOrigin={embed.parentOrigin} chromeless inset>
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="lg" />
          <Callout variant="muted" className="max-w-sm text-center">
            <CalloutDescription>Waiting for image…</CalloutDescription>
          </Callout>
        </div>
      </EmbedLayout>
    )
  }

  return (
    <EmbedLayout
      title=""
      chromeless
      inset
      parentOrigin={embed.isEmbed ? embed.parentOrigin : undefined}
    >
      <div className="h-full min-h-0">
        <ImageCropDialog
          ref={cropRef}
          embedded
          open={Boolean(pendingFile)}
          file={pendingFile}
          defaultAspect={defaultAspect}
          aspectPresets={aspectPresets ?? embed.cropAspectPresets ?? undefined}
          onConfirm={(file) => void handleCropConfirm(file)}
          onCancel={handleCropCancel}
        />
      </div>
    </EmbedLayout>
  )
}
