import type { PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Plus, Settings2, Trash2 } from 'lucide-react'
import { Button } from '@webonone/ui-kit'
import { RESIZE_HANDLES, resizeHandleClassName, type ResizeHandle } from '../document/layout'

const CHROME_ICON_CLASS = 'h-3.5 w-3.5 shrink-0'
const CHROME_BUTTON_CLASS = 'h-7 w-7 shrink-0 rounded-full p-0'

interface SelectionChromeProps {
  kind: 'block' | 'addon'
  canManage?: boolean
  onAddAddon?: () => void
  onOpenSettings: () => void
  onLayer: (direction: 'up' | 'down') => void
  onDelete: () => void
  onResizePointerDown: (event: ReactPointerEvent, handle: ResizeHandle) => void
}

export function SelectionChrome({
  kind,
  canManage = true,
  onAddAddon,
  onOpenSettings,
  onLayer,
  onDelete,
  onResizePointerDown,
}: SelectionChromeProps) {
  const { t } = useTranslation('website')

  function stop(event: ReactPointerEvent | { stopPropagation: () => void }) {
    event.stopPropagation()
  }

  return (
    <>
      {canManage ? (
        <div
          className="absolute right-1 top-1 z-40 flex max-w-[calc(100%-0.5rem)] flex-wrap items-center justify-end gap-1 rounded-full border border-border bg-background p-0.5 shadow-sm"
          data-chrome-action=""
          onPointerDown={stop}
          onClick={stop}
        >
          {kind === 'block' ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={CHROME_BUTTON_CLASS}
                aria-label={t('addAddon')}
                onPointerDown={stop}
                onClick={() => onAddAddon?.()}
              >
                <Plus className={CHROME_ICON_CLASS} aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={CHROME_BUTTON_CLASS}
                aria-label={t('openSettings')}
                onPointerDown={stop}
                onClick={onOpenSettings}
              >
                <Settings2 className={CHROME_ICON_CLASS} aria-hidden />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={CHROME_BUTTON_CLASS}
              aria-label={t('openSettings')}
              onPointerDown={stop}
              onClick={onOpenSettings}
            >
              <Settings2 className={CHROME_ICON_CLASS} aria-hidden />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={CHROME_BUTTON_CLASS}
            aria-label={t('layerUp')}
            onPointerDown={stop}
            onClick={() => onLayer('up')}
          >
            <ChevronUp className={CHROME_ICON_CLASS} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={CHROME_BUTTON_CLASS}
            aria-label={t('layerDown')}
            onPointerDown={stop}
            onClick={() => onLayer('down')}
          >
            <ChevronDown className={CHROME_ICON_CLASS} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className={CHROME_BUTTON_CLASS}
            aria-label={kind === 'addon' ? t('deleteAddon') : t('deleteBlock')}
            onPointerDown={stop}
            onClick={onDelete}
          >
            <Trash2 className={CHROME_ICON_CLASS} aria-hidden />
          </Button>
        </div>
      ) : null}
      {RESIZE_HANDLES.map((handle) => (
        <button
          key={handle}
          type="button"
          data-resize-handle={handle}
          aria-label={t('resizeHandle', { handle })}
          className={resizeHandleClassName(handle, kind)}
          onPointerDown={(event) => {
            event.stopPropagation()
            onResizePointerDown(event, handle)
          }}
          onClick={stop}
        />
      ))}
    </>
  )
}
