import { useRef, useState } from 'react'
import {
  MediaSelectorFrame,
  MediaUploadDialogFrame,
  MediaViewerFrame,
  useMediaEmbedMessage,
} from '@webonone/media-embed'
import type { MediaItemDto } from '@webonone/media-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'

const LIBRARY_SCOPE = 'media:library:default'
const MEDIA_ORIGIN = window.location.origin

function getViewerUrl(): string {
  return `${MEDIA_ORIGIN}/viewer`
}

function getSelectorUrl(): string {
  return `${MEDIA_ORIGIN}/selector`
}

function getUploadDialogUrl(): string {
  return `${MEDIA_ORIGIN}/upload-dialog`
}

type DemoSurface = 'viewer' | 'upload' | 'selector' | null

export function LibraryEmbedDemos() {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [activeDemo, setActiveDemo] = useState<DemoSurface>(null)
  const [openKey, setOpenKey] = useState(0)
  const [demoItem, setDemoItem] = useState<MediaItemDto | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useMediaEmbedMessage({
    mediaOrigin: MEDIA_ORIGIN,
    onSelect: (message) => {
      const item = message.items[0]
      if (item) setDemoItem(item)
      setActiveDemo(null)
    },
    onUploaded: (message) => {
      const item = message.items[0]
      if (item) setDemoItem(item)
      setActiveDemo(null)
    },
    onViewerChanged: (message) => {
      setDemoItem(message.item)
    },
  })

  function openDemo(surface: DemoSurface) {
    setOpenKey((key) => key + 1)
    setActiveDemo(surface)
  }

  const previewUrl = demoItem?.url ?? ''

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Component demos</h2>
      <p className="text-sm text-muted-foreground">
        Open each embed surface in an iframe dialog (same contract as consumer microservices).
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => openDemo('viewer')}>
          Media viewer
        </Button>
        <Button type="button" variant="outline" onClick={() => openDemo('upload')}>
          Media upload
        </Button>
        <Button type="button" variant="outline" onClick={() => openDemo('selector')}>
          Media selector
        </Button>
      </div>

      {previewUrl ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Last selected / uploaded</p>
          <img
            src={previewUrl}
            alt={demoItem?.fileName ?? 'Preview'}
            className="h-[200px] w-[200px] rounded-lg border object-cover"
          />
        </div>
      ) : null}

      <CustomDialog
        open={activeDemo === 'viewer'}
        onOpenChange={(open) => {
          if (!open) setActiveDemo(null)
        }}
        title="Media viewer"
        sizeWidth="small"
        sizeHeight="small"
        noContentPadding
        disableContentScroll
      >
        <MediaViewerFrame
          ref={iframeRef}
          key={`viewer-${openKey}`}
          isOpen={activeDemo === 'viewer'}
          accessToken={accessToken}
          mediaOrigin={MEDIA_ORIGIN}
          baseUrl={getViewerUrl()}
          parentOrigin={window.location.origin}
          scope={LIBRARY_SCOPE}
          fileUrl={previewUrl || undefined}
          mode="view"
          folderPath="/"
          className="h-[200px] w-[200px] border-0 bg-transparent"
        />
      </CustomDialog>

      <CustomDialog
        open={activeDemo === 'upload'}
        onOpenChange={(open) => {
          if (!open) setActiveDemo(null)
        }}
        title="Media upload"
        sizeWidth="medium"
        sizeHeight="large"
        noContentPadding
        disableContentScroll
      >
        <MediaUploadDialogFrame
          key={`upload-${openKey}`}
          isOpen={activeDemo === 'upload'}
          accessToken={accessToken}
          mediaOrigin={MEDIA_ORIGIN}
          baseUrl={getUploadDialogUrl()}
          parentOrigin={window.location.origin}
          scope={LIBRARY_SCOPE}
          folderPath="/"
          mediaType="image"
          autoClose
          className="h-full min-h-0 w-full border-0 bg-transparent"
        />
      </CustomDialog>

      <CustomDialog
        open={activeDemo === 'selector'}
        onOpenChange={(open) => {
          if (!open) setActiveDemo(null)
        }}
        title="Media selector"
        sizeWidth="medium"
        sizeHeight="large"
        className="w-[calc(100vw-1rem)] max-w-4xl sm:w-2/3"
        noContentPadding
        disableContentScroll
      >
        <MediaSelectorFrame
          key={`selector-${openKey}`}
          isOpen={activeDemo === 'selector'}
          accessToken={accessToken}
          mediaOrigin={MEDIA_ORIGIN}
          baseUrl={getSelectorUrl()}
          parentOrigin={window.location.origin}
          scope={LIBRARY_SCOPE}
          folderPath="/"
          mode="single"
          accept="image/*"
          className="h-full min-h-0 w-full border-0 bg-transparent"
        />
      </CustomDialog>
    </section>
  )
}
