import { createContext, useContext } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../lib/cn'

const InsideCardContext = createContext(false)

export function useInsideCard(): boolean {
  return useContext(InsideCardContext)
}

export function Card({
  className,
  compact,
  children,
  ...props
}: ViewProps & { compact?: boolean }) {
  return (
    <InsideCardContext.Provider value={true}>
      <View
        className={cn(
          'rounded-lg border border-border bg-card',
          compact ? 'p-0' : 'p-4',
          className,
        )}
        {...props}
      >
        {children}
      </View>
    </InsideCardContext.Provider>
  )
}
