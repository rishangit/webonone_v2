import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  SelectMedia,
  type SelectMediaValue,
} from '@webonone/ui-kit'
import {
  MediaSelectorFrame,
  sendMediaConfirm,
  useMediaEmbedMessage,
  type MediaEmbedMode,
  type MediaItemDto,
} from '@webonone/media-embed'
import { DemoSection } from '@/components/DemoSection'
import { getMediaOrigin } from '@/features/auth/showcaseAuth'
import { normalizeOrigin, useOriginReachable } from '@/hooks/useOriginReachable'
import { useShowcaseAccessToken } from '@/hooks/useShowcaseAccessToken'

const DEMO_SELECTED_ITEM: SelectMediaValue = {
  id: 'demo-media-1',
  url: 'https://i.pravatar.cc/150?img=11',
  fileName: 'hero-image.jpg',
  mimeType: 'image/jpeg',
}

const DEMO_SELECTED_ITEMS: SelectMediaValue[] = [
  DEMO_SELECTED_ITEM,
  {
    id: 'demo-media-2',
    url: 'https://i.pravatar.cc/150?img=5',
    fileName: 'banner.png',
    mimeType: 'image/png',
  },
  {
    id: 'demo-media-3',
    url: 'https://i.pravatar.cc/150?img=12',
    fileName: 'product.webp',
    mimeType: 'image/webp',
  },
  {
    id: 'demo-media-4',
    url: 'https://i.pravatar.cc/150?img=32',
    fileName: 'gallery-1.jpg',
    mimeType: 'image/jpeg',
  },
  {
    id: 'demo-media-5',
    url: 'https://i.pravatar.cc/150?img=8',
    fileName: 'gallery-2.jpg',
    mimeType: 'image/jpeg',
  },
]

function toSelectMediaValue(item: MediaItemDto): SelectMediaValue {
  return {
    id: item.id,
    url: item.url,
    fileName: item.fileName,
    mimeType: item.mimeType,
  }
}

type MediaPickerFieldProps = {
  scope: string
  multiple?: boolean
  label: string
  mediaOrigin: string
  accessToken: string
  folderPath: string
}

function MediaPickerField({
  scope,
  multiple = false,
  label,
  mediaOrigin,
  accessToken,
  folderPath,
}: MediaPickerFieldProps) {
  const pickerMode: MediaEmbedMode = multiple ? 'multiple' : 'single'
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerAttempt, setPickerAttempt] = useState(0)
  const [selectedItems, setSelectedItems] = useState<SelectMediaValue[]>([])
  const [pendingSelection, setPendingSelection] = useState<MediaItemDto[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const canOpen = mediaOrigin.length > 0
  const primaryItem = selectedItems[0] ?? null

  const selectorUrl = useMemo(() => `${mediaOrigin}/selector`, [mediaOrigin])

  const handleSelect = useCallback((items: MediaItemDto[]) => {
    if (items.length === 0) {
      return
    }
    setSelectedItems(items.map(toSelectMediaValue))
    setPickerOpen(false)
  }, [])

  useMediaEmbedMessage({
    mediaOrigin,
    onSelect: (message) => {
      if (message.scope !== scope) {
        return
      }
      handleSelect(message.items)
    },
    onSelectionChange: (message) => {
      if (message.scope !== scope) {
        return
      }
      setPendingSelection(message.items)
    },
    onCancel: () => {
      setPickerOpen(false)
    },
  })

  function openPicker() {
    if (!canOpen) {
      return
    }
    setPendingSelection([])
    setPickerOpen(true)
    setPickerAttempt((attempt) => attempt + 1)
  }

  function handleDialogOpenChange(open: boolean) {
    setPickerOpen(open)
    if (!open) {
      setPendingSelection([])
    }
  }

  function handleDone() {
    const iframe = iframeRef.current
    if (!iframe || pendingSelection.length === 0) {
      return
    }
    sendMediaConfirm(iframe, mediaOrigin)
  }

  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <SelectMedia
          multiple={multiple}
          selectedItem={multiple ? undefined : primaryItem}
          selectedItems={multiple ? selectedItems : undefined}
          placeholder={multiple ? 'Choose media' : 'Choose a media item'}
          onClick={openPicker}
          disabled={!canOpen}
          aria-label={`Open Media picker (${label})`}
        />
      </div>

      <CustomDialog
        open={pickerOpen}
        onOpenChange={handleDialogOpenChange}
        title="Select media"
        description={
          multiple
            ? 'Choose one or more files, then click Done.'
            : 'Choose a file, then click Done.'
        }
        sizeWidth="large"
        sizeHeight="xlarge"
        noContentPadding
        disableContentScroll
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" className="h-10 px-4" onClick={() => setPickerOpen(false)}>
              Cancel
            </Button>
            <Button
              className="h-10 px-4"
              onClick={handleDone}
              disabled={pendingSelection.length === 0}
            >
              Done
              {pendingSelection.length > 0 ? ` (${pendingSelection.length})` : ''}
            </Button>
          </div>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          {canOpen ? (
            <MediaSelectorFrame
              key={`${pickerAttempt}-${accessToken ? 'authed' : 'guest'}`}
              ref={iframeRef}
              isOpen={pickerOpen}
              accessToken={accessToken || null}
              mediaOrigin={mediaOrigin}
              baseUrl={selectorUrl}
              parentOrigin={window.location.origin}
              scope={scope}
              folderPath={folderPath}
              mode={pickerMode}
              className="block h-full min-h-[420px] w-full border-0 bg-transparent"
            />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center p-6 text-sm text-muted-foreground">
              Configure a valid `VITE_MEDIA_ORIGIN` before opening the picker.
            </div>
          )}
        </div>
      </CustomDialog>
    </>
  )
}

export function SelectMediaControlsDemo() {
  const { accessToken } = useShowcaseAccessToken()
  const mediaOriginNormalized = useMemo(() => normalizeOrigin(getMediaOrigin()), [])
  const mediaReachable = useOriginReachable(mediaOriginNormalized)

  return (
    <DemoSection
      id="select-media"
      title="Select media"
      description="Media-hosted selector embed for single or multi-select. Choose files, then click Done."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Placeholder</p>
            <SelectMedia placeholder="Choose media" onClick={() => undefined} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Selected (single)</p>
            <SelectMedia selectedItem={DEMO_SELECTED_ITEM} onClick={() => undefined} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Selected (multi stack)</p>
            <SelectMedia multiple selectedItems={DEMO_SELECTED_ITEMS} onClick={() => undefined} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Disabled</p>
            <SelectMedia placeholder="Choose media" disabled />
          </div>
        </div>

        <div className="grid gap-4 border-t pt-6 sm:grid-cols-2">
          <MediaPickerField
            scope="showcase:complex-controls:media-picker-single"
            label="Single-select (live)"
            mediaOrigin={mediaOriginNormalized}
            accessToken={accessToken}
            folderPath="/"
          />
          <MediaPickerField
            scope="showcase:complex-controls:media-picker-multiple"
            multiple
            label="Multi-select (live)"
            mediaOrigin={mediaOriginNormalized}
            accessToken={accessToken}
            folderPath="/"
          />
        </div>

        {mediaReachable === false ? (
          <Alert variant="destructive">
            <AlertDescription>
              Cannot reach Media frontend at {mediaOriginNormalized}. Start Media with
              `npm run dev:media` (port 3013).
            </AlertDescription>
          </Alert>
        ) : null}
        {!mediaOriginNormalized ? (
          <Alert variant="destructive">
            <AlertDescription>
              `VITE_MEDIA_ORIGIN` is invalid. Set it to a valid Media origin (for example
              `http://127.0.0.1:3013`).
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </DemoSection>
  )
}
