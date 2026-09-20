import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Text, View } from 'react-native'
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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

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
      {children}
      <View pointerEvents="none" className="absolute left-4 right-4 top-12 z-50 gap-2">
        {items.map((item) => (
          <View
            key={item.id}
            className={cn(
              'rounded-md px-4 py-3 shadow-md',
              item.variant === 'destructive' ? 'bg-destructive' : 'bg-foreground',
            )}
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
                  item.variant === 'destructive' ? 'text-primary-foreground/90' : 'text-background/90',
                )}
              >
                {item.description}
              </Text>
            ) : null}
          </View>
        ))}
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
