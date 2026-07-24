import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  CustomDialog,
  SelectTag,
  type SelectTagValue,
} from '@webonone/ui-kit'
import {
  DataTagCreateFrame,
  sendDataTagPickerCreateSubmit,
  type DataTagPickerTag,
} from '@webonone/platform-embed'
import { useAppSelector } from '@/app/store/hooks'
import { TagPickerPanel } from '@/features/tags/components/TagPickerPanel'

const TAG_PICKER_DIALOG = {
  sizeWidth: 'small' as const,
  sizeHeight: 'large' as const,
}

export const TAG_CREATE_DIALOG = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

export const TAG_CREATE_EMBED_PATH = '/embed/dialogs/tags/create'

function createNestedRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `tag-select-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const TAG_SELECT_EMBED_PATH = '/embed/dialogs/tags/select'
export const TAG_SELECT_SESSION_PREFIX = 'data:tag-select:'

export function writeTagSelectSession(requestId: string, tags: SelectTagValue[]): void {
  try {
    sessionStorage.setItem(`${TAG_SELECT_SESSION_PREFIX}${requestId}`, JSON.stringify(tags))
  } catch {
    /* ignore quota / private mode */
  }
}

export function readTagSelectSession(requestId: string): SelectTagValue[] {
  try {
    const raw = sessionStorage.getItem(`${TAG_SELECT_SESSION_PREFIX}${requestId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (tag): tag is SelectTagValue =>
        Boolean(tag) &&
        typeof tag === 'object' &&
        typeof (tag as SelectTagValue).id === 'string' &&
        typeof (tag as SelectTagValue).name === 'string' &&
        typeof (tag as SelectTagValue).color === 'string',
    )
  } catch {
    return []
  }
}

export function clearTagSelectSession(requestId: string): void {
  try {
    sessionStorage.removeItem(`${TAG_SELECT_SESSION_PREFIX}${requestId}`)
  } catch {
    /* ignore */
  }
}

export { createNestedRequestId }

type TagSelectTriggerProps = {
  selectedTags: SelectTagValue[]
  onOpen: () => void
  disabled?: boolean
}

/** Trigger only — dialogs must be siblings of the outer form dialog, not children of its body. */
export function TagSelectTrigger({ selectedTags, onOpen, disabled }: TagSelectTriggerProps) {
  return (
    <SelectTag
      multiple
      selectedTags={selectedTags}
      placeholder="Choose tags"
      onClick={onOpen}
      disabled={disabled}
      aria-label="Open tag picker"
    />
  )
}

type TagSelectStackedDialogsProps = {
  pickerOpen: boolean
  selectedTags: SelectTagValue[]
  onDone: (tags: SelectTagValue[]) => void
  onClosePicker: () => void
  /** Base stack level for the picker (form dialog is 0 → use 1). */
  pickerStackLevel?: number
}

/**
 * Sibling stacked dialogs for tag select + create (dialog-windows SelectTag pattern).
 * Render next to the outer form `CustomDialog`, never inside its children.
 */
export function TagSelectStackedDialogs({
  pickerOpen,
  selectedTags,
  onDone,
  onClosePicker,
  pickerStackLevel = 1,
}: TagSelectStackedDialogsProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const dataOrigin = window.location.origin.replace(/\/$/, '')
  const scope = 'data:catalog:tag-select'

  const [pendingSelection, setPendingSelection] = useState<DataTagPickerTag[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createAttempt, setCreateAttempt] = useState(0)
  const [blockPickerDismiss, setBlockPickerDismiss] = useState(false)
  const createOpenRef = useRef(false)
  const blockPickerDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)
  const createIframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    createOpenRef.current = createOpen
  }, [createOpen])

  useEffect(() => {
    if (pickerOpen) {
      setPendingSelection(selectedTags)
    } else {
      setCreateOpen(false)
      createOpenRef.current = false
      setPendingSelection([])
    }
  }, [pickerOpen, selectedTags])

  useEffect(() => {
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  const closeCreateDialog = useCallback(() => {
    setCreateOpen(false)
    createOpenRef.current = false
    blockPickerDismissRef.current = true
    setBlockPickerDismiss(true)
    if (blockTimerRef.current !== null) {
      window.clearTimeout(blockTimerRef.current)
    }
    blockTimerRef.current = window.setTimeout(() => {
      blockPickerDismissRef.current = false
      setBlockPickerDismiss(false)
      blockTimerRef.current = null
    }, 150)
  }, [])

  const closePickerDialog = useCallback(() => {
    setCreateOpen(false)
    createOpenRef.current = false
    onClosePicker()
  }, [onClosePicker])

  function handlePickerOpenChange(next: boolean) {
    if (next) return
    if (createOpenRef.current || createOpen) {
      closeCreateDialog()
      return
    }
    if (blockPickerDismissRef.current || blockPickerDismiss) {
      return
    }
    closePickerDialog()
  }

  function handleDone() {
    onDone(
      pendingSelection.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
    )
    closePickerDialog()
  }

  function openCreateDialog() {
    createOpenRef.current = true
    setCreateOpen(true)
    setCreateAttempt((attempt) => attempt + 1)
  }

  function handleCreateSubmit() {
    const iframe = createIframeRef.current
    if (!iframe) return
    sendDataTagPickerCreateSubmit(iframe, dataOrigin, scope)
  }

  function handleCreated(tag: DataTagPickerTag) {
    const nextPending = pendingSelection.some((entry) => entry.id === tag.id)
      ? pendingSelection
      : [...pendingSelection, tag]
    setPendingSelection(nextPending)
    closeCreateDialog()
  }

  return (
    <>
      <CustomDialog
        open={pickerOpen}
        onOpenChange={handlePickerOpenChange}
        title="Select tags"
        description="Choose one or more tags, then click Done."
        sizeWidth={TAG_PICKER_DIALOG.sizeWidth}
        sizeHeight={TAG_PICKER_DIALOG.sizeHeight}
        noContentPadding
        disableContentScroll
        stackLevel={pickerStackLevel}
        nestedDismissGuard={createOpen || blockPickerDismiss}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={(event) => {
                event.stopPropagation()
                closePickerDialog()
              }}
            >
              Cancel
            </Button>
            <Button type="button" className="h-10 px-4" onClick={handleDone}>
              Done
              {pendingSelection.length > 0 ? ` (${pendingSelection.length})` : ''}
            </Button>
          </>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <TagPickerPanel
            enabled={pickerOpen}
            multiple
            selectedTags={pendingSelection}
            onSelectionChange={setPendingSelection}
            onCreateRequest={openCreateDialog}
          />
        </div>
      </CustomDialog>

      <CustomDialog
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) closeCreateDialog()
        }}
        title="Add new tag"
        description="Create a tag, then it is selected in the picker automatically."
        sizeWidth={TAG_CREATE_DIALOG.sizeWidth}
        sizeHeight={TAG_CREATE_DIALOG.sizeHeight}
        noContentPadding
        disableContentScroll
        stackLevel={pickerStackLevel + 1}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={(event) => {
                event.stopPropagation()
                closeCreateDialog()
              }}
            >
              Cancel
            </Button>
            <Button type="button" className="h-10 px-4" onClick={handleCreateSubmit}>
              Create
            </Button>
          </>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          {accessToken ? (
            <DataTagCreateFrame
              key={`${createAttempt}-${accessToken}`}
              ref={createIframeRef}
              isOpen={createOpen}
              accessToken={accessToken}
              dataOrigin={dataOrigin}
              parentOrigin={window.location.origin}
              scope={scope}
              className="block h-full min-h-0 w-full border-0 bg-transparent"
              onCreated={handleCreated}
              onCancel={closeCreateDialog}
            />
          ) : null}
        </div>
      </CustomDialog>
    </>
  )
}
