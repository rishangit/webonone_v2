import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
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

  const viewport =
    toasts.length > 0 ? (
      <div
        aria-live="polite"
        className="ui-toast-viewport pointer-events-none fixed bottom-4 right-4 z-[100] flex w-auto flex-col items-end gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto min-w-[12rem] max-w-sm ui-shape-panel-sm px-4 py-3 text-foreground shadow-lg',
              t.variant === 'destructive'
                ? 'border border-destructive/50 bg-destructive text-destructive-foreground'
                : 'glass-card',
            )}
          >
            <p className="text-sm font-medium">{t.title}</p>
            {t.description ? <p className="mt-0.5 text-sm opacity-90">{t.description}</p> : null}
          </div>
        ))}
      </div>
    ) : null

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' && viewport
        ? createPortal(viewport, document.body)
        : null}
    </ToastContext.Provider>
  )
}
