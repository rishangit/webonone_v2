import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '../lib/utils'
import { inputFocusRingClassName } from './Input'

export type SegmentedSwitchSize = 'default' | 'sm'

const SegmentedSwitchSizeContext = React.createContext<SegmentedSwitchSize>('default')

export type SegmentedSwitchProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
  size?: SegmentedSwitchSize
}

const SegmentedSwitch = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  SegmentedSwitchProps
>(({ className, size = 'default', orientation = 'horizontal', ...props }, ref) => (
  <SegmentedSwitchSizeContext.Provider value={size}>
    <RadioGroupPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        'inline-flex items-stretch rounded-md border border-input bg-muted p-1',
        size === 'sm' ? 'h-9' : 'h-10',
        className,
      )}
      {...props}
    />
  </SegmentedSwitchSizeContext.Provider>
))
SegmentedSwitch.displayName = 'SegmentedSwitch'

export type SegmentedSwitchItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>

const SegmentedSwitchItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  SegmentedSwitchItemProps
>(({ className, ...props }, ref) => {
  const size = React.useContext(SegmentedSwitchSizeContext)
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'ui-segmented-switch-item inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition-colors',
        'data-[state=unchecked]:text-muted-foreground data-[state=unchecked]:hover:text-foreground',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 text-sm' : 'px-3 text-sm',
        inputFocusRingClassName,
        className,
      )}
      {...props}
    />
  )
})
SegmentedSwitchItem.displayName = 'SegmentedSwitchItem'

export { SegmentedSwitch, SegmentedSwitchItem }
