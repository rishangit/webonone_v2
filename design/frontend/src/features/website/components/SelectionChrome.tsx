import type { PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@webonone/ui-kit'
import { RESIZE_HANDLES, resizeHandleClassName, type ResizeHandle } from '../document/layout'
import type { DesignerSelection } from '../types'

const CHROME_ICON_CLASS = 'h-3.5 w-3.5 shrink-0'
const CHROME_BUTTON_CLASS = 'h-7 w-7 shrink-0 flex-none rounded-full p-0'
const CHROME_TOOLBAR_CLASS =
  'pointer-events-auto absolute z-40 flex w-max max-w-none shrink-0 flex-nowrap items-center gap-1 rounded-full border border-border bg-background p-0.5 shadow-sm'

interface SelectionChromeProps {
  kind: 'block' | 'addon'
  /** Exact selection being resized — avoids picking up a different item mid-gesture. */
  grabbed: DesignerSelection
  canManage?: boolean
  onAddAddon?: () => void
  onOpenSettings: () => void
  onDuplicate?: () => void
  onSaveAsPreset?: () => void
  saveAsPresetDisabled?: boolean
  onLayer: (direction: 'up' | 'down') => void
  onDelete: () => void
  onResizePointerDown: (
    event: ReactPointerEvent,
    handle: ResizeHandle,
    grabbed: DesignerSelection,
  ) => void
}

export function SelectionChrome({
  kind,
  grabbed,
  canManage = true,
  onAddAddon,
  onOpenSettings,
  onDuplicate,
  onSaveAsPreset,
  saveAsPresetDisabled = false,
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
      <div
        className={cn(CHROME_TOOLBAR_CLASS, 'right-1 top-1')}
        data-chrome-action=""
        onPointerDown={stop}
        onClick={stop}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={CHROME_BUTTON_CLASS}
              aria-label={kind === 'addon' ? t('addonActions') : t('blockActions')}
              onPointerDown={stop}
            >
              <MoreVertical className={CHROME_ICON_CLASS} aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" onClick={stop}>
            {onAddAddon ? (
              <DropdownMenuItem onClick={() => onAddAddon()}>{t('addAddon')}</DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={onOpenSettings}>{t('openSettings')}</DropdownMenuItem>
            {canManage && onDuplicate ? (
              <DropdownMenuItem onClick={() => onDuplicate()}>{t('duplicate')}</DropdownMenuItem>
            ) : null}
            {canManage && onSaveAsPreset ? (
              <DropdownMenuItem
                disabled={saveAsPresetDisabled}
                title={saveAsPresetDisabled ? t('saveAsPresetDisabled') : undefined}
                onClick={() => onSaveAsPreset()}
              >
                {t('saveAsPreset')}
              </DropdownMenuItem>
            ) : null}
            {canManage ? (
              <>
                <DropdownMenuItem onClick={() => onLayer('up')}>{t('layerUp')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLayer('down')}>{t('layerDown')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  {kind === 'addon' ? t('deleteAddon') : t('deleteBlock')}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {RESIZE_HANDLES.map((handle) => (
        <button
          key={handle}
          type="button"
          data-resize-handle={handle}
          aria-label={t('resizeHandle', { handle })}
          className={resizeHandleClassName(handle, kind)}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onResizePointerDown(event, handle, grabbed)
          }}
          onClick={stop}
        />
      ))}
    </>
  )
}
