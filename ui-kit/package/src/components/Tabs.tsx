import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../lib/utils'
import { inputFocusRingClassName } from './Input'

/** Tab strip — full-width bottom rule; curves wrap around the selected tab. */
export const tabsListClassName =
  'inline-flex w-full flex-wrap items-end overflow-visible border-b border-secondary px-3'

/**
 * Tab trigger base styles.
 * Active: theme secondary border on top/left/right; page-colored bottom; secondary text;
 * outer bottom curves via `.ui-tabs-trigger` ::before/::after.
 */
export const tabsTriggerClassName = cn(
  'ui-tabs-trigger inline-flex items-center justify-center whitespace-nowrap rounded-t-md border-0 border-t border-r border-[hsl(var(--glass-border))] bg-muted px-6 py-1.5 text-sm font-medium text-muted-foreground/60 transition-colors',
  'hover:text-muted-foreground',
  'disabled:pointer-events-none disabled:opacity-50',
  'data-[state=active]:z-10 data-[state=active]:-mb-px data-[state=active]:border data-[state=active]:border-secondary data-[state=active]:border-b-[hsl(var(--background-base))] data-[state=active]:bg-[hsl(var(--background-base))] data-[state=active]:text-secondary',
)

export const tabsContentClassName = 'mt-4 outline-none'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn(tabsListClassName, className)} {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerClassName, inputFocusRingClassName, className)}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(tabsContentClassName, inputFocusRingClassName, className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
