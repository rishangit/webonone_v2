import { useEffect, useRef, useState } from 'react'
import { Callout, CalloutDescription, Spinner } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { mediaActions } from '@/features/media/store'
import { EmbedLayout } from '../components/EmbedLayout'
import { ImageCropDialog } from '../components/ImageCropDialog'
import { UploadDropzone } from '../components/UploadDropzone'
import { mediaTypeToAccept, useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaEmbedAuth } from '../hooks/useMediaEmbedAuth'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'

export function UploadDialogPage() {
  const dispatch = useAppDispatch()
  const embed = useEmbedMode()
  const { accessToken } = useMediaEmbedAuth(embed)
  const { postUploaded, postCancel } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const uploadPendingRef = useRef(false)

  const { uploadStatus, lastUploadedItems, uploadError, lastUploadFailed } = useAppSelector(
    (s) => s.media,
  )

  const scope = embed.scope ?? 'media:library:default'
  const accept = mediaTypeToAccept(embed.mediaType, embed.accept)
  const maxFiles = embed.maxFiles || 1
  const cropEnabled =
    embed.crop && (embed.mediaType === 'image' || accept.includes('image'))

  useEffect(() => {
    if (!uploadPendingRef.current || uploadStatus === 'uploading') {
      return
    }
    if (uploadStatus === 'error') {
      setError(uploadError ?? 'Upload failed')
      uploadPendingRef.current = false
      dispatch(mediaActions.resetUpload())
      return
    }
    if (lastUploadFailed.length) {
      setError(lastUploadFailed.map((f) => `${f.fileName}: ${f.reason}`).join('; '))
    }
    if (lastUploadedItems.length) {
      if (embed.isEmbed) {
        postUploaded(lastUploadedItems)
      }
    }
    uploadPendingRef.current = false
    dispatch(mediaActions.resetUpload())
  }, [
    dispatch,
    embed.isEmbed,
    lastUploadFailed,
    lastUploadedItems,
    postUploaded,
    uploadError,
    uploadStatus,
  ])

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

  function uploadFile(file: File) {
    setError(null)
    uploadPendingRef.current = true
    dispatch(
      mediaActions.uploadRequested({
        files: [file],
        scope,
        folderPath: embed.folderPath,
      }),
    )
  }

  async function handleFilesSelected(files: File[]) {
    const file = files[0]
    if (!file) return

    if (cropEnabled && file.type.startsWith('image/')) {
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

  const content = (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {uploadStatus === 'uploading' ? (
        <p className="text-sm text-muted-foreground">Uploading…</p>
      ) : null}
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
