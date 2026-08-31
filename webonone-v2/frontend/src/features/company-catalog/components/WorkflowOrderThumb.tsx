import { cn, itemListThumbClassName } from '@webonone/ui-kit'

type WorkflowOrderThumbProps = {
  orderNumber: number
}

export function WorkflowOrderThumb({ orderNumber }: WorkflowOrderThumbProps) {
  return (
    <div
      className={cn(
        itemListThumbClassName,
        'flex items-center justify-center bg-muted/60 text-base font-semibold text-foreground',
      )}
      aria-label={`Step ${orderNumber}`}
    >
      {orderNumber}
    </div>
  )
}
