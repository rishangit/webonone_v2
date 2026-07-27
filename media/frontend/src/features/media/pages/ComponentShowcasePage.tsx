import { useEffect, useState } from 'react'
import type { MediaItemDto } from '@webonone/media-embed'
import {
  MediaSelectorFrame,
  MediaUploadDialogFrame,
  useMediaEmbedMessage,
} from '@webonone/media-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { MediaViewer } from '../components/MediaViewer'
import { ensureFolderPath } from '../services/mediaApi'

const SHOWCASE_SCOPE = 'media:showcase:default'
const MEDIA_ORIGIN = window.location.origin
const SHOWCASE_FOLDER = '/'

function getSelectorUrl(): string {
  return `${MEDIA_ORIGIN}/selector`
}

function getUploadDialogUrl(): string {
  return `${MEDIA_ORIGIN}/upload-dialog`
}

type DialogSurface = 'profileSelector' | 'rootSelector' | 'rootUpload' | null

export function ComponentShowcasePage() {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const [viewerMode, setViewerMode] = useState<'view' | 'edit'>('view')
  const [previewItem, setPreviewItem] = useState<MediaItemDto | null>(null)
  const [activeDialog, setActiveDialog] = useState<DialogSurface>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [folderReady, setFolderReady] = useState(false)

  useEffect(() => {
    if (!user) {
      setPreviewItem(null)
      return
    }
    if (user.avatarUrl) {
      setPreviewItem({
        id: `avatar-${user.id}`,
        url: user.avatarUrl,
        fileName: 'profile',
        mimeType: 'image/jpeg',
        sizeBytes: 0,
      })
    }
  }, [user])

  useMediaEmbedMessage({
    mediaOrigin: MEDIA_ORIGIN,
    onSelect: (message) => {
      const item = message.items[0]
      if (item) {
        setPreviewItem(item)
      }
      setActiveDialog(null)
    },
    onUploaded: (message) => {
      const item = message.items[0]
      if (item) {
        setPreviewItem(item)
      }
      setActiveDialog(null)
    },
    onViewerChanged: (message) => {
      setPreviewItem(message.item)
    },
  })

  async function openProfileSelector() {
    if (!accessToken) return
    setFolderReady(false)
    try {
      await ensureFolderPath(SHOWCASE_SCOPE, SHOWCASE_FOLDER)
      setFolderReady(true)
      setDialogKey((key) => key + 1)
      setActiveDialog('profileSelector')
    } catch {
      setFolderReady(true)
      setDialogKey((key) => key + 1)
      setActiveDialog('profileSelector')
    }
  }

  function openDialog(surface: DialogSurface) {
    setDialogKey((key) => key + 1)
    setActiveDialog(surface)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Components</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exercise Media embed surfaces from the standalone app (same contracts as consumer
          microservices).
        </p>
      </div>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Media view</h2>
        <p className="text-sm text-muted-foreground">
          Shows the logged-in user image. Toggle view/edit or double-click the preview. In edit
          mode, use the centered pencil to open the selector at{' '}
          <code className="text-xs">{SHOWCASE_SCOPE}</code>.
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="h-[200px] w-[200px] shrink-0 overflow-hidden rounded-lg border">
            {previewItem ? (
              <MediaViewer
                item={previewItem}
                mode={viewerMode}
                onToggleMode={() => setViewerMode((m) => (m === 'view' ? 'edit' : 'view'))}
                onEdit={viewerMode === 'edit' ? () => void openProfileSelector() : undefined}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setViewerMode((m) => (m === 'view' ? 'edit' : 'view'))}
          >
            Switch to {viewerMode === 'view' ? 'edit' : 'view'} mode
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Media upload</h2>
        <p className="text-sm text-muted-foreground">Opens upload dialog scoped to {SHOWCASE_SCOPE}.</p>
        <Button type="button" variant="outline" onClick={() => openDialog('rootUpload')}>
          Open media upload
        </Button>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Media select</h2>
        <p className="text-sm text-muted-foreground">
          Opens selector scoped to {SHOWCASE_SCOPE} (includes desktop upload with 1:1 crop for images).
        </p>
        <Button type="button" onClick={() => openDialog('rootSelector')}>
          Click me
        </Button>
      </section>

      <CustomDialog
        open={activeDialog === 'profileSelector' && folderReady}
        onOpenChange={(open) => {
          if (!open) setActiveDialog(null)
        }}
        title="Select profile image"
        sizeWidth="large"
        sizeHeight="xlarge"
        className="w-[calc(100vw-1rem)] max-w-5xl sm:w-3/4"
        noContentPadding
        disableContentScroll
      >
        <MediaSelectorFrame
          key={`profile-selector-${dialogKey}`}
          isOpen={activeDialog === 'profileSelector'}
          accessToken={accessToken}
          mediaOrigin={MEDIA_ORIGIN}
          baseUrl={getSelectorUrl()}
          parentOrigin={window.location.origin}
          scope={SHOWCASE_SCOPE}
          folderPath={SHOWCASE_FOLDER}
          mode="single"
          accept="image/*"
          selectorUpload
          className="h-full min-h-0 w-full border-0 bg-transparent"
        />
      </CustomDialog>

      <CustomDialog
        open={activeDialog === 'rootSelector'}
        onOpenChange={(open) => {
          if (!open) setActiveDialog(null)
        }}
        title="Media selector"
        sizeWidth="medium"
        sizeHeight="large"
        className="w-[calc(100vw-1rem)] max-w-4xl sm:w-2/3"
        noContentPadding
        disableContentScroll
      >
        <MediaSelectorFrame
          key={`root-selector-${dialogKey}`}
          isOpen={activeDialog === 'rootSelector'}
          accessToken={accessToken}
          mediaOrigin={MEDIA_ORIGIN}
          baseUrl={getSelectorUrl()}
          parentOrigin={window.location.origin}
          scope={SHOWCASE_SCOPE}
          folderPath={SHOWCASE_FOLDER}
          mode="single"
          accept="image/*"
          selectorUpload
          className="h-full min-h-0 w-full border-0 bg-transparent"
        />
      </CustomDialog>

      <CustomDialog
        open={activeDialog === 'rootUpload'}
        onOpenChange={(open) => {
          if (!open) setActiveDialog(null)
        }}
        title="Media upload"
        sizeWidth="medium"
        sizeHeight="large"
        noContentPadding
        disableContentScroll
      >
        <MediaUploadDialogFrame
          key={`root-upload-${dialogKey}`}
          isOpen={activeDialog === 'rootUpload'}
          accessToken={accessToken}
          mediaOrigin={MEDIA_ORIGIN}
          baseUrl={getUploadDialogUrl()}
          parentOrigin={window.location.origin}
          scope={SHOWCASE_SCOPE}
          folderPath={SHOWCASE_FOLDER}
          mediaType="image"
          autoClose
          className="h-full min-h-0 w-full border-0 bg-transparent"
        />
      </CustomDialog>
    </div>
  )
}
