import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { cn } from '../lib/cn'
import {
  controlDisplayTextProps,
  controlTriggerClassName,
  controlTriggerValueClassName,
} from '../lib/controlStyles'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { SelectDropdownMenu, type SelectDropdownAnchor } from './SelectDropdownMenu'

type SelectContextValue = {
  value?: string
  placeholder?: string
  disabled?: boolean
  onValueChange?: (value: string) => void
  options: { value: string; label: ReactNode }[]
}

const SelectContext = createContext<SelectContextValue | null>(null)

type SelectItemElement = { value: string; children: ReactNode }
type SelectContentElement = { children: ReactNode }

function collectOptions(children: ReactNode): { value: string; label: ReactNode }[] {
  const collected: { value: string; label: ReactNode }[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === SelectContent) {
      const content = child as React.ReactElement<SelectContentElement>
      Children.forEach(content.props.children, (item) => {
        if (!isValidElement(item) || item.type !== SelectItem) return
        const option = item as React.ReactElement<SelectItemElement>
        collected.push({ value: String(option.props.value), label: option.props.children })
      })
    }
    if (child.type === SelectItem) {
      const option = child as React.ReactElement<SelectItemElement>
      collected.push({ value: String(option.props.value), label: option.props.children })
    }
  })
  return collected
}

function findTrigger(children: ReactNode): ReactNode {
  let trigger: ReactNode = null
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === SelectTrigger || child.type === SelectValue) {
      trigger = child
    }
  })
  return trigger
}

export function Select({
  value,
  onValueChange,
  placeholder,
  disabled,
  children,
}: {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  children: ReactNode
}) {
  const options = useMemo(() => collectOptions(children), [children])
  const trigger = useMemo(() => findTrigger(children), [children])

  return (
    <SelectContext.Provider value={{ value, onValueChange, placeholder, disabled, options }}>
      {trigger}
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  placeholder,
  className,
  children,
}: {
  placeholder?: string
  className?: string
  children?: ReactNode
}) {
  const context = useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within Select')

  let childPlaceholder = placeholder
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== SelectValue) return
    const props = child.props as { placeholder?: string }
    childPlaceholder = props.placeholder ?? childPlaceholder
  })

  const iconColor = useThemedControlIconColor()
  const triggerRef = useRef<View>(null)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<SelectDropdownAnchor | null>(null)

  const selected = context.options.find((option) => option.value === context.value)
  const hasValue = context.value !== undefined && context.value !== ''
  const resolvedPlaceholder = childPlaceholder ?? context.placeholder ?? 'Select…'
  const label = hasValue ? selected?.label ?? context.value : resolvedPlaceholder

  function openMenu() {
    if (!context || context.disabled) return
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height })
      setOpen(true)
    })
  }

  function closeMenu() {
    setOpen(false)
    setAnchor(null)
  }

  return (
    <>
      <View ref={triggerRef} collapsable={false} className="w-full">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          disabled={context.disabled}
          onPress={openMenu}
          className={cn(
            controlTriggerClassName,
            context.disabled && 'opacity-50',
            className,
          )}
        >
          <View className="min-w-0 flex-1 justify-center pr-2">
            {typeof label === 'string' ? (
              <Text
                numberOfLines={1}
                className={cn(
                  controlTriggerValueClassName,
                  hasValue && selected ? 'text-foreground' : 'text-muted',
                )}
                {...controlDisplayTextProps()}
              >
                {label}
              </Text>
            ) : (
              label
            )}
          </View>
          <ChevronDown size={18} color={iconColor} strokeWidth={2} />
        </Pressable>
      </View>
      <SelectDropdownMenu
        open={open}
        onClose={closeMenu}
        anchor={anchor}
        options={context.options}
        value={context.value}
        onSelect={(next) => context.onValueChange?.(next)}
      />
    </>
  )
}

export function SelectValue(_props: { placeholder?: string }) {
  return null
}

export function SelectContent(_props: { children: ReactNode }) {
  return null
}

export function SelectItem(_props: { value: string; children: ReactNode }) {
  return null
}
