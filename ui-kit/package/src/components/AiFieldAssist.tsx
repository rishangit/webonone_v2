import * as React from 'react'

export type AiFieldAssistControl = 'input' | 'textarea'

export type AiFieldAssistField = {
  name?: string
  label?: string
  control: AiFieldAssistControl
}

export type AiFieldAssistFormField = {
  label: string
  name?: string
  value: string
}

export type AiFieldAssistRequest = {
  text: string
  field: AiFieldAssistField
  form?: { fields: AiFieldAssistFormField[] }
}

export type AiFieldAssistContextValue = {
  enabled: boolean
  polish: (input: AiFieldAssistRequest) => Promise<string>
}

const AiFieldAssistContext = React.createContext<AiFieldAssistContextValue | null>(null)

export function AiFieldAssistProvider({
  enabled,
  polish,
  children,
}: {
  enabled: boolean
  polish: (input: AiFieldAssistRequest) => Promise<string>
  children: React.ReactNode
}) {
  const value = React.useMemo(() => ({ enabled, polish }), [enabled, polish])
  return <AiFieldAssistContext.Provider value={value}>{children}</AiFieldAssistContext.Provider>
}

export function useAiFieldAssist(): AiFieldAssistContextValue | null {
  return React.useContext(AiFieldAssistContext)
}
