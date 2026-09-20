import { Button } from './Button'
import { CustomDialog, type CustomDialogProps, type DialogSizePreset } from './CustomDialog'

export type { DialogSizePreset }

export type DialogProps = Pick<
  CustomDialogProps,
  'open' | 'onOpenChange' | 'title' | 'description' | 'children' | 'footer'
> & {
  sizeWidth?: DialogSizePreset
  sizeHeight?: DialogSizePreset
}

/** @deprecated Prefer `CustomDialog` for new popups — same API as web `@webonone/ui-kit` CustomDialog. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  sizeWidth = 'medium',
  sizeHeight = 'auto',
}: DialogProps) {
  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      sizeWidth={sizeWidth}
      sizeHeight={sizeHeight}
    >
      {children}
    </CustomDialog>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  busy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  busy?: boolean
}) {
  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      sizeWidth="small"
      sizeHeight="auto"
      footer={
        <>
          <Button variant="outline" disabled={busy} onPress={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} loading={busy} onPress={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
