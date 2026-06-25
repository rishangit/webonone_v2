import { useCallback, useEffect, useState } from 'react'
import { Button } from '@webonone/ui-kit'
import type { MediaItemDto } from '@webonone/media-embed'
import { useMediaEmbedMessage } from '@webonone/media-embed'
import { useAppSelector } from '@/app/store/hooks'
import { apiClient } from '@/shared/services/apiClient'
import { MediaPickerModal } from '../components/MediaPickerModal'
import { MediaSelectorModal } from '../components/MediaSelectorModal'
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
  const { accessToken } = useAppSelector((s) => s.auth)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [pickerOpenKey, setPickerOpenKey] = useState(0)
  const [selectorOpenKey, setSelectorOpenKey] = useState(0)
  const [refs, setRefs] = useState<SiteMediaRef[]>([])
  const [heroItem, setHeroItem] = useState<MediaItemDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const siteId = getDemoSiteId()

  const loadRefs = useCallback(async () => {
    try {
      const data = await apiClient<{ refs: SiteMediaRef[] }>(`/sites/${siteId}/media-refs`)
      setRefs(data.refs)
      if (data.refs[0]) {
        setHeroItem({
          id: data.refs[0].mediaId,
          url: data.refs[0].mediaUrl,
          fileName: data.refs[0].label ?? data.refs[0].mediaId,
          mimeType: 'image/jpeg',
          sizeBytes: 0,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media refs')
    }
  }, [siteId])

  useEffect(() => {
    void loadRefs()
  }, [loadRefs])

  const handleComplete = useCallback(
    async (items: MediaItemDto[]) => {
      setIsPickerOpen(false)
      setIsSelectorOpen(false)
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
          setHeroItem(items[0])
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
      setHeroItem(message.item)
      void handleComplete([message.item])
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
      if (heroItem?.id === ref.mediaId) {
        setHeroItem(null)
      }
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
        <h2 className="text-lg font-semibold">Hero image (viewer + selector)</h2>
        {heroItem ? (
          <MediaViewerEmbed
            accessToken={accessToken}
            fileUrl={heroItem.url}
            mediaId={heroItem.id}
            mode="edit"
          />
        ) : (
          <p className="text-sm text-muted-foreground">No hero image selected yet.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectorOpenKey((key) => key + 1)
              setIsSelectorOpen(true)
            }}
          >
            Change via selector
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
        folderPath="/"
        openKey={selectorOpenKey}
        onClose={() => setIsSelectorOpen(false)}
      />
    </div>
  )
}
