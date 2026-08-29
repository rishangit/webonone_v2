import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const calloutVariants = cva('ui-shape-panel border p-4 shadow-sm', {
  variants: {
    variant: {
      highlight: 'border-primary/35 bg-primary/10 ring-1 ring-primary/15',
      muted: 'border-[hsl(var(--glass-border))] bg-muted/40',
    },
  },
  defaultVariants: {
    variant: 'highlight',
  },
})

function Callout({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof calloutVariants>) {
  return <div className={cn(calloutVariants({ variant }), className)} {...props} />
}

function CalloutTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm font-semibold text-foreground', className)} {...props} />
}

function CalloutDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-1.5 text-sm leading-relaxed text-muted-foreground', className)} {...props} />
}

function CalloutAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-3 flex flex-wrap items-center gap-2', className)} {...props} />
}

export { Callout, CalloutTitle, CalloutDescription, CalloutAction, calloutVariants }
export type CalloutProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof calloutVariants>
