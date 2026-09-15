import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AiFieldAssistProvider, useToast, type AiFieldAssistRequest } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { aiApi } from '@/shared/services/aiApi'

export function AiFieldAssistHost({ children }: { children: ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { toast } = useToast()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      setEnabled(false)
      return
    }
    let cancelled = false
    aiApi
      .getAiSettings()
      .then((data) => {
        if (!cancelled) setEnabled(data.configured)
      })
      .catch(() => {
        if (!cancelled) setEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  const polish = useCallback(
    async (input: AiFieldAssistRequest) => {
      try {
        const data = await aiApi.polishText(input)
        return data.text
      } catch (err) {
        toast({
          title: 'Could not improve text',
          description: err instanceof Error ? err.message : undefined,
          variant: 'destructive',
        })
        throw err
      }
    },
    [toast],
  )

  return (
    <AiFieldAssistProvider enabled={Boolean(accessToken) && enabled} polish={polish}>
      {children}
    </AiFieldAssistProvider>
  )
}
