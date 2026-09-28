import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { MoreVertical } from 'lucide-react-native'
import { cn } from '../lib/cn'
import { CustomDialog } from './CustomDialog'
import { Button } from './Button'
import { Body } from './Typography'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'

type ItemListMenuContextValue = {
  close: () => void
}

const ItemListMenuContext = createContext<ItemListMenuContextValue | null>(null)

export function ItemListMenu({
  children,
  ariaLabel = 'Row actions',
}: {
  children: ReactNode
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const menuContext = useMemo(() => ({ close }), [close])
  const iconColor = useThemedControlIconColor()

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ariaLabel}
        onPress={() => setOpen(true)}
        className="h-8 w-8 items-center justify-center rounded-control"
      >
        <MoreVertical size={16} color={iconColor} />
      </Pressable>
      <CustomDialog
        open={open}
        onOpenChange={setOpen}
        title={ariaLabel}
        sizeWidth="small"
        sizeHeight="auto"
        footer={
          <Button variant="outline" onPress={close}>
            Cancel
          </Button>
        }
      >
        <ItemListMenuContext.Provider value={menuContext}>
          <View className="gap-1">{children}</View>
        </ItemListMenuContext.Provider>
      </CustomDialog>
    </>
  )
}

export function ItemListMenuItem({
  children,
  onPress,
  destructive,
  disabled,
}: {
  children: ReactNode
  onPress?: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  const menu = useContext(ItemListMenuContext)

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        if (disabled) return
        menu?.close()
        onPress?.()
      }}
      className={cn('rounded-lg px-3 py-3', disabled && 'opacity-50')}
    >
      {typeof children === 'string' ? (
        <Body className={destructive ? 'text-destructive' : undefined}>{children}</Body>
      ) : (
        children
      )}
    </Pressable>
  )
}

export function ItemListMenuSeparator() {
  return <View className="my-1 h-px bg-border" />
}
