import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AiFieldAssistProvider, useToast, type AiFieldAssistRequest } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { aiFetch } from '@/features/ai/utils/aiClient'

export function AiFieldAssistHost({ children }: { children: ReactNode }) {
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { toast } = useToast()
  const [providerReady, setProviderReady] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      setProviderReady(false)
      return
    }
    let cancelled = false
    aiFetch<{ configured: boolean }>('/me/ai-settings', accessToken)
      .then((data) => {
        if (!cancelled) setProviderReady(data.configured)
      })
      .catch(() => {
        // CORS or network failure — still show controls; polish will surface errors.
        if (!cancelled) setProviderReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  const polish = useCallback(
    async (input: AiFieldAssistRequest) => {
      if (!accessToken) {
        throw new Error('Sign in required')
      }
      try {
        const data = await aiFetch<{ text: string }>('/text/polish', accessToken, {
          method: 'POST',
          body: JSON.stringify(input),
        })
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
    [accessToken, toast],
  )

  const assistEnabled = Boolean(accessToken) && providerReady

  return (
    <AiFieldAssistProvider enabled={assistEnabled} polish={polish}>
      {children}
    </AiFieldAssistProvider>
  )
}
