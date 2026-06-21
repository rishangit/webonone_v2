import { MediaPickerFrame } from '@webonone/media-embed'
import { buildDemoMediaScope, getMediaOrigin, getMediaPickerUrl } from '../utils/mediaConfig'

interface MediaPickerModalProps {
  isOpen: boolean
  accessToken: string | null
  onClose: () => void
  /** Remount iframe when incremented so folder navigation resets to root */
  openKey: number
}

export function MediaPickerModal({ isOpen, accessToken, onClose, openKey }: MediaPickerModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-sm font-semibold">Choose images</h2>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <MediaPickerFrame
            key={openKey}
            isOpen={isOpen}
            accessToken={accessToken}
            mediaOrigin={getMediaOrigin()}
            baseUrl={getMediaPickerUrl()}
            parentOrigin={window.location.origin}
            scope={buildDemoMediaScope()}
            folderPath="/"
            mode="multiple"
            accept="image/*"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  )
}
