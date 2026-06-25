import { useState } from 'react'
import { Callout, CalloutDescription, Spinner } from '@webonone/ui-kit'
import { EmbedLayout } from '../components/EmbedLayout'
import { ImageCropDialog } from '../components/ImageCropDialog'
import { UploadDropzone } from '../components/UploadDropzone'
import { mediaTypeToAccept, useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaAuth } from '../hooks/useMediaAuth'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'
import { uploadMediaFile } from '../services/mediaApi'

export function UploadDialogPage() {
  const embed = useEmbedMode()
  const { accessToken } = useMediaAuth(embed.isEmbed)
  const { postUploaded, postCancel } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scope = embed.scope ?? 'media:library:default'
  const accept = mediaTypeToAccept(embed.mediaType, embed.accept)
  const maxFiles = embed.maxFiles || 1
  const cropEnabled =
    embed.crop && (embed.mediaType === 'image' || accept.includes('image'))

  if (embed.isEmbed && !accessToken) {
    return (
      <EmbedLayout title="Upload" parentOrigin={embed.parentOrigin} chromeless>
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
    setError(null)
    try {
      const result = await uploadMediaFile(file, scope, embed.folderPath)
      if (embed.isEmbed) {
        postUploaded([result.item])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  async function handleFilesSelected(files: File[]) {
    const file = files[0]
    if (!file) return

    if (cropEnabled && file.type.startsWith('image/')) {
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

  const content = (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <UploadDropzone
        accept={accept}
        multiple={maxFiles > 1}
        maxFiles={maxFiles}
        onFilesSelected={handleFilesSelected}
      />
      <ImageCropDialog
        open={cropOpen}
        file={pendingFile}
        defaultAspect={embed.defaultCropAspect}
        onConfirm={(file) => void handleCropConfirm(file)}
        onCancel={() => {
          setCropOpen(false)
          setPendingFile(null)
          if (embed.isEmbed) {
            postCancel()
          }
        }}
      />
    </div>
  )

  if (embed.isEmbed) {
    return (
      <EmbedLayout title="Upload" parentOrigin={embed.parentOrigin} chromeless>
        {content}
      </EmbedLayout>
    )
  }

  return (
    <EmbedLayout title="Upload dialog" parentOrigin={null}>
      {content}
    </EmbedLayout>
  )
}
