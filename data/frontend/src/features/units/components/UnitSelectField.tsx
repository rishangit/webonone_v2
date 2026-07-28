import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button, CustomDialog, cn } from '@webonone/ui-kit'
import { UnitPickerPanel, type UnitSelectValue } from '@/features/units/components/UnitPickerPanel'
import { UnitFormDialog } from '@/features/units/components/UnitFormDialog'
import { DATA_FORM_DIALOG_SIZE } from '@/shared/utils/dataFormDialogSize'
import type { Unit } from '@/shared/types/data.types'

export type { UnitSelectValue }

export const UNIT_PICKER_DIALOG = {
  sizeWidth: 'small' as const,
  sizeHeight: 'large' as const,
}

export const UNIT_CREATE_DIALOG = {
  sizeWidth: DATA_FORM_DIALOG_SIZE.sizeWidth,
  sizeHeight: DATA_FORM_DIALOG_SIZE.sizeHeight,
}

export const UNIT_SELECT_EMBED_PATH = '/embed/dialogs/units/select'
export const UNIT_CREATE_EMBED_PATH = '/embed/dialogs/units/create'
export const UNIT_SELECT_SESSION_PREFIX = 'data:unit-select:'

function createNestedRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `unit-select-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export { createNestedRequestId }

function isUnitSelectValue(value: unknown): value is UnitSelectValue {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as UnitSelectValue).id === 'string' &&
    typeof (value as UnitSelectValue).name === 'string' &&
    typeof (value as UnitSelectValue).symbol === 'string'
  )
}

export function writeUnitSelectSession(requestId: string, unit: UnitSelectValue | null): void {
  try {
    sessionStorage.setItem(
      `${UNIT_SELECT_SESSION_PREFIX}${requestId}`,
      JSON.stringify(unit),
    )
  } catch {
    /* ignore quota / private mode */
  }
}

export function readUnitSelectSession(requestId: string): UnitSelectValue | null {
  try {
    const raw = sessionStorage.getItem(`${UNIT_SELECT_SESSION_PREFIX}${requestId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return isUnitSelectValue(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function clearUnitSelectSession(requestId: string): void {
  try {
    sessionStorage.removeItem(`${UNIT_SELECT_SESSION_PREFIX}${requestId}`)
  } catch {
    /* ignore */
  }
}

export function toUnitSelectValue(unit: Unit | UnitSelectValue): UnitSelectValue {
  return { id: unit.id, name: unit.name, symbol: unit.symbol }
}

type UnitSelectTriggerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type' | 'onClick'
> & {
  selectedUnit: UnitSelectValue | null
  onOpen: () => void
}

/**
 * Trigger only — dialogs must be siblings of the outer form dialog, not children of its body.
 * Matches SelectTrigger chrome so it sits clearly with other attribute form fields.
 */
export const UnitSelectTrigger = forwardRef<HTMLButtonElement, UnitSelectTriggerProps>(
  function UnitSelectTrigger(
    { selectedUnit, onOpen, disabled, className, 'aria-label': ariaLabel, ...props },
    ref,
  ) {
    const hasSelection = Boolean(selectedUnit)
    const resolvedAriaLabel =
      ariaLabel ??
      (hasSelection && selectedUnit
        ? `Selected unit ${selectedUnit.name} (${selectedUnit.symbol})`
        : 'Open unit of measure picker')

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-input-background px-3 text-sm text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        disabled={disabled}
        aria-label={resolvedAriaLabel}
        onClick={onOpen}
        {...props}
      >
        {hasSelection && selectedUnit ? (
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedUnit.name} ({selectedUnit.symbol})
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">
            Select unit of measure…
          </span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
      </button>
    )
  },
)

type UnitSelectStackedDialogsProps = {
  pickerOpen: boolean
  selectedUnit: UnitSelectValue | null
  onDone: (unit: UnitSelectValue | null) => void
  onClosePicker: () => void
  /** Base stack level for the picker (form dialog is 0 → use 1). */
  pickerStackLevel?: number
}

/**
 * Sibling stacked dialogs for unit select + create (dialog-windows SelectTag pattern).
 * Render next to the outer form `CustomDialog`, never inside its children.
 */
export function UnitSelectStackedDialogs({
  pickerOpen,
  selectedUnit,
  onDone,
  onClosePicker,
  pickerStackLevel = 1,
}: UnitSelectStackedDialogsProps) {
  const [pendingSelection, setPendingSelection] = useState<UnitSelectValue | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [blockPickerDismiss, setBlockPickerDismiss] = useState(false)
  const createOpenRef = useRef(false)
  const blockPickerDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)

  useEffect(() => {
    createOpenRef.current = createOpen
  }, [createOpen])

  useEffect(() => {
    if (pickerOpen) {
      setPendingSelection(selectedUnit)
    } else {
      setCreateOpen(false)
      createOpenRef.current = false
      setPendingSelection(null)
    }
  }, [pickerOpen, selectedUnit])

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
    onDone(pendingSelection)
    closePickerDialog()
  }

  function openCreateDialog() {
    createOpenRef.current = true
    setCreateOpen(true)
  }

  function handleCreated(unit?: Unit) {
    if (unit) {
      setPendingSelection(toUnitSelectValue(unit))
    }
    closeCreateDialog()
  }

  return (
    <>
      <CustomDialog
        open={pickerOpen}
        onOpenChange={handlePickerOpenChange}
        title="Choose unit"
        description="Select a unit of measure, or None if not applicable."
        sizeWidth={UNIT_PICKER_DIALOG.sizeWidth}
        sizeHeight={UNIT_PICKER_DIALOG.sizeHeight}
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
            </Button>
          </>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <UnitPickerPanel
            enabled={pickerOpen}
            selectedUnit={pendingSelection}
            onSelectionChange={setPendingSelection}
            onCreateRequest={openCreateDialog}
          />
        </div>
      </CustomDialog>

      <UnitFormDialog
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) closeCreateDialog()
        }}
        onSaved={handleCreated}
        stackLevel={pickerStackLevel + 1}
      />
    </>
  )
}
