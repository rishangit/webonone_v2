import { useCallback, useEffect, useState } from 'react'
import type { MediaItemDto } from '@webonone/media-embed'
import { Alert, AlertDescription, Callout, CalloutDescription, Spinner } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { mediaActions } from '@/features/media/store'
import { EmbedLayout } from '../components/EmbedLayout'
import { MediaViewer } from '../components/MediaViewer'
import { ScopedFolderBrowser } from '../components/ScopedFolderBrowser'
import { useEmbedMode, type ViewerMode } from '../hooks/useEmbedMode'
import { useMediaEmbedAuth } from '../hooks/useMediaEmbedAuth'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'

export function ViewerPage() {
  const dispatch = useAppDispatch()
  const embed = useEmbedMode()
  const { accessToken } = useMediaEmbedAuth(embed)
  const { postViewerChanged } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const [item, setItem] = useState<MediaItemDto | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [externalError, setExternalError] = useState<string | null>(null)

  const { detailItem, detailStatus, detailError, detailId } = useAppSelector((s) => s.media)

  const scope = embed.scope ?? 'media:library:default'
  const [activeMode, setActiveMode] = useState<ViewerMode>(embed.viewerMode)

  useEffect(() => {
    setActiveMode(embed.viewerMode)
  }, [embed.viewerMode])

  const toggleViewerMode = useCallback(() => {
    setActiveMode((current) => (current === 'view' ? 'edit' : 'view'))
  }, [])

  useEffect(() => {
    if (embed.mediaId) {
      dispatch(mediaActions.fetchDetailRequested({ id: embed.mediaId }))
      return
    }
    dispatch(mediaActions.resetDetail())
    if (embed.fileUrl) {
      setItem({
        id: embed.mediaId ?? 'external',
        url: embed.fileUrl,
        fileName: embed.fileUrl.split('/').pop() ?? 'file',
        mimeType: embed.fileUrl.match(/\.(png|jpe?g|gif|webp)$/i) ? 'image/jpeg' : 'application/octet-stream',
        sizeBytes: 0,
      })
      setExternalError(null)
      return
    }
    setItem(null)
    setExternalError('fileUrl or mediaId is required')
  }, [dispatch, embed.fileUrl, embed.mediaId])

  useEffect(() => {
    if (embed.mediaId && detailId === embed.mediaId && detailItem) {
      setItem(detailItem)
      setExternalError(null)
    }
  }, [detailId, detailItem, embed.mediaId])

  const loading = embed.mediaId ? detailStatus === 'loading' : false
  const error = externalError ?? (embed.mediaId ? detailError : null)

  if (embed.isEmbed && !accessToken) {
    return (
      <EmbedLayout title="Viewer" parentOrigin={embed.parentOrigin} chromeless>
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="lg" />
          <Callout variant="muted" className="max-w-sm text-center">
            <CalloutDescription>Waiting for authentication…</CalloutDescription>
          </Callout>
        </div>
      </EmbedLayout>
    )
  }

  function handleSelectReplacement(selected: MediaItemDto) {
    setItem(selected)
    setSelectorOpen(false)
    if (embed.isEmbed) {
      postViewerChanged(selected)
    }
  }

  const content = (
    <div className="relative flex h-full min-h-[240px] flex-col gap-3">
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <MediaViewer
          item={item}
          mode={activeMode}
          onToggleMode={toggleViewerMode}
          onEdit={activeMode === 'edit' ? () => setSelectorOpen(true) : undefined}
        />
      )}
      {selectorOpen ? (
        <div className="absolute inset-0 z-10 flex flex-col rounded-lg border bg-background p-3 shadow-lg">
          <ScopedFolderBrowser
            scope={scope}
            scopedRoot={embed.folderPath}
            mode="single"
            onSelectFile={handleSelectReplacement}
          />
        </div>
      ) : null}
    </div>
  )

  if (embed.isEmbed) {
    return (
      <EmbedLayout title="Viewer" parentOrigin={embed.parentOrigin} chromeless>
        {content}
      </EmbedLayout>
    )
  }

  return <EmbedLayout title="Media viewer">{content}</EmbedLayout>
}
