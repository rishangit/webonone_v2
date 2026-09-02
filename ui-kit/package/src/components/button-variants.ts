import { cva } from 'class-variance-authority'
import { interactiveHoverClassName } from '../lib/selectionStyles'

export const buttonVariants = cva(
  'ui-control-label ui-shape-control ui-shape-button inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
        variant: {
        default: 'btn-primary-gradient',
        destructive: 'bg-error text-[var(--color-primary-text)] hover:bg-error/90',
        outline:
          'border border-secondary bg-transparent text-secondary hover:border-secondary-hover hover:text-secondary-hover',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        ghost: `text-label ${interactiveHoverClassName}`,
        link: 'text-primary underline-offset-4 hover:underline [clip-path:none]',
      },
      size: {
        default: 'h-10 px-4 has-[svg]:px-6',
        sm: 'h-9 px-3 has-[svg]:px-5',
        lg: 'h-11 px-8 has-[svg]:px-10',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
