import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '../lib/utils'
import { menuPanelBodyClassName, menuPanelClassName } from '../lib/menuPanel'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    /** `menu` = frosted menu surface; `body` = opaque page-body wash (theme canvas). */
    surface?: 'menu' | 'body'
  }
>(({ className, align = 'center', sideOffset = 4, surface = 'menu', ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-[110] w-auto ui-shape-panel-sm p-4 outline-none',
        surface === 'body' ? menuPanelBodyClassName : menuPanelClassName,
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
