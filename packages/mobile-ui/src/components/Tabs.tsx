import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native'
import { cn } from '../lib/cn'
import { CONTROL_HEIGHT_CLASS, controlLabelClassName } from '../lib/controlStyles'
import { useThemeColors } from '../theme/ThemeProvider'
import { PrimaryGradientFill } from './PrimaryGradientFill'

/** Horizontal scroll viewport for the tab strip. */
export const tabsListScrollClassName = 'w-full min-w-0'

/** Inner tab row — segmented track; grows with tab count inside scroll viewport. */
export const tabsListClassName = cn(
  CONTROL_HEIGHT_CLASS,
  'flex-row flex-nowrap items-stretch gap-0 rounded-control border border-input-border bg-transparent p-1',
)

/** Outer shell — width only; track chrome lives on {@link tabsListClassName}. */
export const tabsListShellClassicClassName = 'w-full min-w-0'

/** @deprecated Use {@link tabsListShellClassicClassName}. */
export const tabsListShellClassName = tabsListShellClassicClassName

/** @deprecated Trigger wrapper removed — tabs are direct list children. */
export const tabsTriggerShellClassicClassName = ''

/** @deprecated Use {@link tabsTriggerShellClassicClassName}. */
export const tabsTriggerShellClassName = tabsTriggerShellClassicClassName

const tabsTriggerSharedClassName =
  'relative h-full min-h-0 shrink-0 flex-row items-center justify-center overflow-hidden rounded-control px-5'

/** Segmented tab trigger — active paint matches web segmented tabs. */
export const tabsTriggerClassicClassName = tabsTriggerSharedClassName

/** @deprecated Use {@link tabsTriggerClassicClassName}. */
export const tabsTriggerClassName = tabsTriggerClassicClassName

/** Standard tab page layout — consistent title → strip → panel spacing. */
export const tabsPageClassName = 'gap-2'

/** Tab panel on feature/detail pages — defers strip gap to parent `tabsPageClassName`. */
export const tabsPageContentClassName = ''

export const tabsContentClassName = 'pt-2 pb-4'

type TabsContextValue = {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

type TabsListContextValue = {
  registerTrigger: (value: string, x: number, width: number) => void
  unregisterTrigger: (value: string) => void
}

const TabsListContext = createContext<TabsListContextValue | null>(null)

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs')
  }
  return context
}

function useTabsListContext(): TabsListContextValue {
  const context = useContext(TabsListContext)
  if (!context) {
    throw new Error('TabsList children must be used within TabsList')
  }
  return context
}

export type TabsProps = ViewProps & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: ReactNode
}

export function Tabs({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolledValue

  const handleValueChange = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next)
      }
      onValueChange?.(next)
    },
    [isControlled, onValueChange],
  )

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <View className={cn(tabsPageClassName, className)} {...props}>
        {children}
      </View>
    </TabsContext.Provider>
  )
}

export type TabsListProps = ViewProps & {
  children: ReactNode
  'aria-label'?: string
}

export function TabsList({ className, children, 'aria-label': ariaLabel, ...props }: TabsListProps) {
  const { value } = useTabsContext()
  const scrollRef = useRef<ScrollView>(null)
  const triggerLayouts = useRef(new Map<string, { x: number; width: number }>())

  const registerTrigger = useCallback((triggerValue: string, x: number, width: number) => {
    triggerLayouts.current.set(triggerValue, { x, width })
  }, [])

  const unregisterTrigger = useCallback((triggerValue: string) => {
    triggerLayouts.current.delete(triggerValue)
  }, [])

  useEffect(() => {
    const layout = triggerLayouts.current.get(value)
    const scrollView = scrollRef.current
    if (!layout || !scrollView) return

    scrollView.scrollTo({
      x: Math.max(0, layout.x - 16),
      animated: true,
    })
  }, [value])

  return (
    <TabsListContext.Provider value={{ registerTrigger, unregisterTrigger }}>
      <View className={cn(tabsListShellClassicClassName, className)} {...props}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          className={tabsListScrollClassName}
          accessibilityRole="tablist"
          accessibilityLabel={ariaLabel}
        >
          <View className={tabsListClassName}>{children}</View>
        </ScrollView>
      </View>
    </TabsListContext.Provider>
  )
}

export type TabsTriggerProps = Omit<PressableProps, 'children'> & {
  value: string
  children: ReactNode
  disabled?: boolean
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled,
  onLayout,
  ...props
}: TabsTriggerProps) {
  const { value: activeValue, onValueChange } = useTabsContext()
  const { registerTrigger, unregisterTrigger } = useTabsListContext()
  const colors = useThemeColors()
  const selected = activeValue === value

  useEffect(() => {
    return () => unregisterTrigger(value)
  }, [unregisterTrigger, value])

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange(value)}
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout
        registerTrigger(value, x, width)
        onLayout?.(event)
      }}
      className={cn(tabsTriggerClassicClassName, disabled && 'opacity-50', className)}
      {...props}
    >
      {selected ? <PrimaryGradientFill fromColor={colors.secondary} toColor={colors.primary} /> : null}
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text
          className={cn(
            'relative z-10',
            controlLabelClassName,
            selected ? 'text-primary-foreground' : 'text-muted',
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

export type TabsContentProps = ViewProps & {
  value: string
  children: ReactNode
}

export function TabsContent({ value, children, className, ...props }: TabsContentProps) {
  const { value: activeValue } = useTabsContext()
  if (activeValue !== value) return null

  return (
    <View className={cn(tabsContentClassName, tabsPageContentClassName, className)} {...props}>
      {children}
    </View>
  )
}
