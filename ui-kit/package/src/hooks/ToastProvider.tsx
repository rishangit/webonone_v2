import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type Toast } from './toast-context'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (input: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { ...input, id }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md border px-4 py-3 shadow-lg ${
              t.variant === 'destructive'
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'bg-background'
            }`}
          >
            <p className="text-sm font-medium">{t.title}</p>
            {t.description ? <p className="text-sm opacity-90">{t.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
