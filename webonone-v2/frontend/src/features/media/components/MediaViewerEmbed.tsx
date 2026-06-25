import { useRef } from 'react'
import { MediaViewerFrame } from '@webonone/media-embed'
import { useThemeBridge } from '@/shared/theme/ThemeProviderBridge'
import {
  buildDemoMediaScope,
  getMediaOrigin,
  getMediaViewerUrl,
} from '../utils/mediaConfig'

interface MediaViewerEmbedProps {
  accessToken: string | null
  fileUrl: string
  mediaId?: string
  mode?: 'view' | 'edit'
  className?: string
}

export function MediaViewerEmbed({
  accessToken,
  fileUrl,
  mediaId,
  mode = 'edit',
  className,
}: MediaViewerEmbedProps) {
  const { broadcastToIframes } = useThemeBridge()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  return (
    <MediaViewerFrame
      ref={iframeRef}
      isOpen
      accessToken={accessToken}
      mediaOrigin={getMediaOrigin()}
      baseUrl={getMediaViewerUrl()}
      parentOrigin={window.location.origin}
      scope={buildDemoMediaScope()}
      fileUrl={fileUrl}
      mediaId={mediaId}
      mode={mode}
      className={className ?? 'h-48 w-full rounded-lg border-0 bg-transparent'}
      onLoad={broadcastToIframes}
    />
  )
}
