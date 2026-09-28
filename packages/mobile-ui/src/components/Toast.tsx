import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cn } from '../lib/cn'

type ToastVariant = 'default' | 'destructive'

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastItem = ToastInput & { id: number }

interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_EDGE = 16
const TOAST_MAX_WIDTH = 384

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const insets = useSafeAreaInsets()

  const toast = useCallback((input: ToastInput) => {
    const id = nextId.current
    nextId.current += 1
    setItems((prev) => [...prev, { ...input, id }])
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }, 3200)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      <View className="flex-1">
        {children}
        <View
          pointerEvents="box-none"
          className="absolute z-[100] gap-2"
          style={{
            bottom: insets.bottom + TOAST_EDGE,
            right: insets.right + TOAST_EDGE,
            left: insets.left + TOAST_EDGE,
            alignItems: 'flex-end',
          }}
        >
          {items.map((item) => (
            <View
              key={item.id}
              className={cn(
                'rounded-md px-4 py-3 shadow-md',
                item.variant === 'destructive' ? 'bg-destructive' : 'bg-foreground',
              )}
              style={{ maxWidth: TOAST_MAX_WIDTH, alignSelf: 'flex-end' }}
            >
              <Text
                className={cn(
                  'font-semibold',
                  item.variant === 'destructive' ? 'text-primary-foreground' : 'text-background',
                )}
              >
                {item.title}
              </Text>
              {item.description ? (
                <Text
                  className={cn(
                    'text-sm',
                    item.variant === 'destructive'
                      ? 'text-primary-foreground/90'
                      : 'text-background/90',
                  )}
                >
                  {item.description}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
