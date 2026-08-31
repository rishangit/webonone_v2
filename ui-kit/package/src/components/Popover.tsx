import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '../lib/utils'
import {
  menuPanelBodyClassName,
  menuPanelClassName,
  popoverPointerBeforeClassName,
  popoverPointerHorizontalBeforeClassName,
  popoverWhitePanelClassName,
} from '../lib/menuPanel'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    /** `menu` = frosted menu surface; `body` = opaque page-body wash; `white` = opaque solid panel; `transparent` = no panel fill. */
    surface?: 'menu' | 'body' | 'white' | 'transparent'
    /** Render a ::before caret pointing at the popover trigger. */
    showPointer?: boolean
    /** Limit caret to left/right popover sides only. */
    horizontalPointer?: boolean
    /** Reposition every animation frame while open — keeps anchored during scroll. */
    updatePositionStrategy?: 'optimized' | 'always'
    /** Called after the popover is placed or repositioned. */
    onPlaced?: () => void
  }
>(({ className, align = 'center', sideOffset = 4, surface = 'menu', showPointer = false, horizontalPointer = false, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-[110] w-auto ui-shape-panel-sm p-4 outline-none',
        surface === 'body'
          ? menuPanelBodyClassName
          : surface === 'white'
            ? popoverWhitePanelClassName
            : surface === 'transparent'
              ? 'bg-transparent shadow-none border-0 backdrop-blur-none'
              : menuPanelClassName,
        showPointer &&
          (horizontalPointer || surface === 'white'
            ? popoverPointerHorizontalBeforeClassName
            : popoverPointerBeforeClassName),
        showPointer &&
          surface === 'transparent' &&
          'before:bg-[hsl(var(--background-base))]',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
