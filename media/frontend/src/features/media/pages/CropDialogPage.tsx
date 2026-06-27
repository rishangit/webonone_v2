import { useRef } from 'react'
import { Callout, CalloutDescription, Spinner } from '@webonone/ui-kit'
import { EmbedLayout } from '../components/EmbedLayout'
import { ImageCropDialog, type ImageCropDialogHandle } from '../components/ImageCropDialog'
import { useEmbedDocumentFill } from '../hooks/useEmbedDocumentFill'
import { useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaAuth } from '../hooks/useMediaAuth'
import { useMediaCropInit } from '../hooks/useMediaCropInit'
import { useMediaParentCommands } from '../hooks/useMediaParentCommands'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'
import { uploadMediaFile } from '../services/mediaApi'

export function CropDialogPage() {
  const embed = useEmbedMode()
  const cropRef = useRef<ImageCropDialogHandle>(null)
  useEmbedDocumentFill(embed.isEmbed)
  const { accessToken } = useMediaAuth(embed.isEmbed)
  const { postSelect, postCancel } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const { pendingFile, defaultAspect, aspectPresets, clearPending } = useMediaCropInit(
    embed.isEmbed,
    embed.parentOrigin,
  )

  const scope = embed.scope ?? 'media:library:default'
  const folderPath = embed.folderPath ?? '/root'

  useMediaParentCommands(embed.isEmbed, embed.parentOrigin, () => {
    void cropRef.current?.confirm()
  })

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

  async function uploadFile(file: File) {
    const result = await uploadMediaFile(file, scope, folderPath)
    if (embed.isEmbed) {
      postSelect([result.item])
    }
  }

  async function handleCropConfirm(cropped: File) {
    clearPending()
    await uploadFile(cropped)
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
