import { useState } from 'react'
import type { MediaItemDto } from '@webonone/media-embed'
import { Button, Callout, CalloutDescription, Spinner } from '@webonone/ui-kit'
import { EmbedLayout } from '../components/EmbedLayout'
import { ScopedFolderBrowser } from '../components/ScopedFolderBrowser'
import { useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaAuth } from '../hooks/useMediaAuth'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'

export function SelectorPage() {
  const embed = useEmbedMode()
  const { accessToken } = useMediaAuth(embed.isEmbed)
  const { postSelect } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const [selectedItems, setSelectedItems] = useState<MediaItemDto[]>([])

  const scope = embed.scope ?? 'media:library:default'

  if (embed.isEmbed && !accessToken) {
    return (
      <EmbedLayout title="Select file" parentOrigin={embed.parentOrigin} chromeless>
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="lg" />
          <Callout variant="muted" className="max-w-sm text-center">
            <CalloutDescription>Waiting for authentication…</CalloutDescription>
          </Callout>
        </div>
      </EmbedLayout>
    )
  }

  function handleSelectFile(item: MediaItemDto) {
    if (embed.mode === 'single') {
      if (embed.isEmbed) {
        postSelect([item])
      }
      return
    }
    setSelectedItems((prev) => {
      const exists = prev.some((p) => p.id === item.id)
      if (exists) {
        return prev.filter((p) => p.id !== item.id)
      }
      return [...prev, item]
    })
  }

  function handleToggleSelect(item: MediaItemDto) {
    setSelectedItems((prev) => {
      const exists = prev.some((p) => p.id === item.id)
      if (exists) {
        return prev.filter((p) => p.id !== item.id)
      }
      return [...prev, item]
    })
  }

  function handleConfirmMultiple() {
    if (embed.isEmbed && selectedItems.length) {
      postSelect(selectedItems)
    }
  }

  const selectedIds = new Set(selectedItems.map((item) => item.id))

  const content = (
    <div className="flex h-full min-h-[320px] flex-col gap-3">
      <ScopedFolderBrowser
        scope={scope}
        scopedRoot={embed.folderPath}
        mode={embed.mode}
        selectedIds={selectedIds}
        onSelectFile={handleSelectFile}
        onToggleSelect={handleToggleSelect}
      />
      {embed.mode === 'multiple' ? (
        <div className="flex justify-end border-t pt-3">
          <Button
            type="button"
            disabled={!selectedItems.length}
            onClick={handleConfirmMultiple}
          >
            Confirm ({selectedItems.length})
          </Button>
        </div>
      ) : null}
    </div>
  )

  if (embed.isEmbed) {
    return (
      <EmbedLayout title="Select file" parentOrigin={embed.parentOrigin} chromeless>
        {content}
      </EmbedLayout>
    )
  }

  return <EmbedLayout title="File selector">{content}</EmbedLayout>
}
