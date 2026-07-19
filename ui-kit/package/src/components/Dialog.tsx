import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

const dialogSizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm max-h-[min(24rem,85vh)]',
  md: 'max-w-md max-h-[min(28rem,85vh)]',
  lg: 'max-w-lg max-h-[min(32rem,85vh)]',
  xl: 'max-w-xl max-h-[min(36rem,85vh)]',
  '2xl': 'max-w-2xl max-h-[min(42rem,90vh)]',
  '3xl': 'max-w-3xl max-h-[min(48rem,90vh)]',
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize
}

function DialogContent({ className, children, size = 'md', ...props }: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-2 sm:p-4">
        <DialogPrimitive.Content
          className={cn(
            'glass-card-solid relative flex w-full flex-col overflow-hidden rounded-lg text-foreground shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            dialogSizeClasses[size],
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'shrink-0 space-y-1.5 border-b px-6 pb-4 pt-6 pr-12 text-center sm:text-left',
        className,
      )}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'scrollbar-themed scrollbar-gutter-stable min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-4',
        className,
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col-reverse border-t px-6 pb-6 pt-4 sm:flex-row sm:justify-end sm:space-x-2',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
