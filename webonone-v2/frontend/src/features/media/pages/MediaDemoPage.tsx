import { useCallback, useEffect, useState } from 'react'
import { Button } from '@webonone/ui-kit'
import type { MediaItemDto } from '@webonone/media-embed'
import { useMediaEmbedMessage } from '@webonone/media-embed'
import { useAppSelector } from '@/app/store/hooks'
import { apiClient } from '@/shared/services/apiClient'
import { MediaPickerModal } from '../components/MediaPickerModal'
import { MediaSelectorModal } from '../components/MediaSelectorModal'
import { MediaUploadDialogModal } from '../components/MediaUploadDialogModal'
import { MediaViewerEmbed } from '../components/MediaViewerEmbed'
import { useMediaSelection } from '../hooks/useMediaSelection'
import { buildDemoMediaScope, getDemoSiteId, getMediaApiBase, getMediaOrigin } from '../utils/mediaConfig'

interface SiteMediaRef {
  id: string
  siteId: string
  mediaId: string
  mediaUrl: string
  label: string | null
}

export function MediaDemoPage() {
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [pickerOpenKey, setPickerOpenKey] = useState(0)
  const [selectorOpenKey, setSelectorOpenKey] = useState(0)
  const [uploadOpenKey, setUploadOpenKey] = useState(0)
  const [refs, setRefs] = useState<SiteMediaRef[]>([])
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(user?.avatarUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const siteId = getDemoSiteId()
  const profileFolderPath = user ? `/root/users/${user.id}` : '/'

  const loadRefs = useCallback(async () => {
    try {
      const data = await apiClient<{ refs: SiteMediaRef[] }>(`/sites/${siteId}/media-refs`)
      setRefs(data.refs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media refs')
    }
  }, [siteId])

  useEffect(() => {
    void loadRefs()
  }, [loadRefs])

  useEffect(() => {
    if (user?.avatarUrl) {
      setProfileImageUrl(user.avatarUrl)
    }
  }, [user?.avatarUrl])

  const handleComplete = useCallback(
    async (items: MediaItemDto[]) => {
      setIsPickerOpen(false)
      setIsSelectorOpen(false)
      setIsUploadOpen(false)
      try {
        await apiClient(`/sites/${siteId}/media-refs`, {
          method: 'POST',
          body: JSON.stringify({
            items: items.map((item) => ({
              mediaId: item.id,
              mediaUrl: item.url,
              label: item.fileName,
            })),
          }),
        })
        await loadRefs()
        if (items[0]) {
          setProfileImageUrl(items[0].url)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save media refs')
      }
    },
    [loadRefs, siteId],
  )

  useMediaSelection(handleComplete)

  useMediaEmbedMessage({
    mediaOrigin: getMediaOrigin(),
    onViewerChanged: (message) => {
      setProfileImageUrl(message.item.url)
      void handleComplete([message.item])
    },
    onUploaded: (message) => {
      const item = message.items[0]
      if (!item) return
      setProfileImageUrl(item.url)
      void handleComplete([item])
    },
  })

  async function handleRemoveRef(ref: SiteMediaRef) {
    try {
      await fetch(`${getMediaApiBase()}/media/${ref.mediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      await apiClient(`/sites/${siteId}/media-refs/${ref.id}`, { method: 'DELETE' })
      await loadRefs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove media')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Media demo</h1>
      <p className="text-sm text-muted-foreground">
        Scope: <code className="text-xs">{buildDemoMediaScope()}</code>
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Profile image (200×200 viewer)</h2>
        <p className="text-sm text-muted-foreground">
          Double-click the image in the iframe to toggle view/edit mode. In edit mode, use the pencil
          icon to open the file selector scoped to <code className="text-xs">{profileFolderPath}</code>.
        </p>
        {profileImageUrl ? (
          <MediaViewerEmbed
            accessToken={accessToken}
            fileUrl={profileImageUrl}
            mode="view"
            folderPath={profileFolderPath}
          />
        ) : (
          <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
            No profile image
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setUploadOpenKey((key) => key + 1)
              setIsUploadOpen(true)
            }}
          >
            Upload from device
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectorOpenKey((key) => key + 1)
              setIsSelectorOpen(true)
            }}
          >
            Choose from library
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => {
            setPickerOpenKey((key) => key + 1)
            setIsPickerOpen(true)
          }}
        >
          Choose images (picker)
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {refs.map((ref) => (
          <div key={ref.id} className="overflow-hidden rounded-lg border">
            <img src={ref.mediaUrl} alt={ref.label ?? ref.mediaId} className="aspect-square w-full object-cover" />
            <div className="flex items-center justify-between gap-2 p-2">
              <p className="truncate text-xs">{ref.label ?? ref.mediaId}</p>
              <Button type="button" variant="destructive" size="sm" onClick={() => void handleRemoveRef(ref)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        isOpen={isPickerOpen}
        accessToken={accessToken}
        openKey={pickerOpenKey}
        onClose={() => setIsPickerOpen(false)}
      />
      <MediaSelectorModal
        isOpen={isSelectorOpen}
        accessToken={accessToken}
        folderPath={profileFolderPath}
        openKey={selectorOpenKey}
        onClose={() => setIsSelectorOpen(false)}
      />
      <MediaUploadDialogModal
        isOpen={isUploadOpen}
        accessToken={accessToken}
        folderPath={profileFolderPath}
        openKey={uploadOpenKey}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  )
}
