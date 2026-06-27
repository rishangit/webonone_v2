import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

export type DialogSizePreset = 'small' | 'medium' | 'large' | 'xlarge' | 'auto'

const widthClasses: Record<Exclude<DialogSizePreset, 'auto'>, string> = {
  small: 'w-1/2',
  medium: 'w-2/3',
  large: 'w-3/4',
  xlarge: 'w-5/6',
}

const heightClasses: Record<Exclude<DialogSizePreset, 'auto'>, string> = {
  small: 'h-1/3',
  medium: 'h-1/2',
  large: 'h-3/4',
  xlarge: 'h-[90%]',
}

function resolveHeightPreset(
  sizeWidth: DialogSizePreset,
  sizeHeight?: DialogSizePreset,
): DialogSizePreset {
  if (sizeHeight) return sizeHeight
  if (sizeWidth === 'auto') return 'auto'
  return sizeWidth
}

function buildSizeClasses(
  sizeWidth: DialogSizePreset,
  sizeHeight: DialogSizePreset,
  maxWidth: string,
): string {
  const widthPart =
    sizeWidth === 'auto'
      ? cn('w-fit', maxWidth)
      : maxWidth !== 'max-w-lg'
        ? `w-full sm:${maxWidth}`
        : widthClasses[sizeWidth]

  const heightPart = sizeHeight === 'auto' ? 'h-auto' : heightClasses[sizeHeight]

  return cn(widthPart, heightPart, 'max-h-[calc(100vh-1rem)]')
}

export interface CustomDialogProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  customHeader?: React.ReactNode
  footer?: React.ReactNode
  sizeWidth?: DialogSizePreset
  sizeHeight?: DialogSizePreset
  maxWidth?: string
  hideHeader?: boolean
  hideCloseButton?: boolean
  noContentPadding?: boolean
  disableContentScroll?: boolean
  /** When true, blocks overlay/focus/Escape dismiss (use while a nested dialog is open). */
  nestedDismissGuard?: boolean
  id?: string
}

function CustomDialogOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

function CustomDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  customHeader,
  footer,
  children,
  sizeWidth = 'medium',
  sizeHeight,
  maxWidth = 'max-w-lg',
  hideHeader = false,
  hideCloseButton = false,
  noContentPadding = false,
  disableContentScroll = false,
  nestedDismissGuard = false,
  id,
  className,
  onInteractOutside,
  onPointerDownOutside,
  onFocusOutside,
  onEscapeKeyDown,
  ...contentProps
}: CustomDialogProps) {
  const resolvedHeight = resolveHeightPreset(sizeWidth, sizeHeight)
  const sizeClasses = buildSizeClasses(sizeWidth, resolvedHeight, maxWidth)
  const isAutoHeight = resolvedHeight === 'auto'

  const bodyClasses = cn(
    'text-foreground',
    !hideHeader && !noContentPadding && 'p-6',
    noContentPadding && 'p-0',
    disableContentScroll
      ? 'min-h-0 flex-1 overflow-hidden'
      : isAutoHeight
        ? 'min-h-0 shrink overflow-y-auto overscroll-y-contain max-h-[calc(100vh-10rem)] scrollbar-themed scrollbar-gutter-stable transform-gpu'
        : 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain scrollbar-themed scrollbar-gutter-stable transform-gpu',
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <CustomDialogOverlay />
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-2 py-2 sm:px-4 sm:py-4">
          <DialogPrimitive.Content
            id={id}
            className={cn(
              'glass-card flex flex-col overflow-hidden rounded-lg text-foreground shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              sizeClasses,
              className,
            )}
            {...contentProps}
            onInteractOutside={(e) => {
              if (nestedDismissGuard) e.preventDefault()
              onInteractOutside?.(e)
            }}
            onPointerDownOutside={(e) => {
              if (nestedDismissGuard) e.preventDefault()
              onPointerDownOutside?.(e)
            }}
            onFocusOutside={(e) => {
              if (nestedDismissGuard) e.preventDefault()
              onFocusOutside?.(e)
            }}
            onEscapeKeyDown={(e) => {
              if (nestedDismissGuard) e.preventDefault()
              onEscapeKeyDown?.(e)
            }}
          >
            {!hideHeader ? (
              <div
                id={id ? `${id}-header` : undefined}
                className="relative shrink-0 border-b border-[hsl(var(--glass-border))] p-6 pb-4"
              >
                {customHeader ?? (
                  <div className="flex items-start gap-3 pr-8">
                    {icon ? <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div> : null}
                    <div className="space-y-1">
                      {title ? (
                        <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                          {title}
                        </DialogPrimitive.Title>
                      ) : null}
                      {description ? (
                        <DialogPrimitive.Description className="text-sm text-muted-foreground">
                          {description}
                        </DialogPrimitive.Description>
                      ) : null}
                    </div>
                  </div>
                )}
                {!hideCloseButton ? (
                  <DialogPrimitive.Close className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                ) : null}
              </div>
            ) : null}

            <div id={id ? `${id}-body` : undefined} className={bodyClasses}>
              {children}
            </div>

            {footer ? (
              <div
                id={id ? `${id}-footer` : undefined}
                className="flex shrink-0 justify-end gap-2 border-t border-[hsl(var(--glass-border))] px-6 py-3"
              >
                {footer}
              </div>
            ) : null}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { CustomDialog }
