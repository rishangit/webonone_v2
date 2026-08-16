import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppEndPanel, Button, Spinner, Textarea, cn } from '@webonone/ui-kit'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { aiFetch, resolveAiAccessToken } from '@/features/ai/utils/aiClient'
import { RecordResultList, parseRecordsFromText, visibleAssistantText } from '@/features/ai/utils/recordView'

type ChatLine = {
  id: string
  role: 'user' | 'assistant'
  content: string
  resultRecords?: Record<string, unknown>[]
}

type CatalogAssistantProps = {
  open: boolean
  onClose: () => void
}

function newLocalId() {
  return `local-${crypto.randomUUID()}`
}

export function CatalogAssistant({ open, onClose }: CatalogAssistantProps) {
  const { t } = useTranslation('search')
  const { accessToken } = useWebsiteAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [starting, setStarting] = useState(false)
  const [pendingReply, setPendingReply] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setConversationId(null)
    setMessages([])
  }, [accessToken])

  useEffect(() => {
    if (!open || conversationId) return
    let cancelled = false
    setStarting(true)
    resolveAiAccessToken(accessToken)
      .then((token) =>
        aiFetch<{ conversation: { id: string } }>('/conversations', token, {
          method: 'POST',
          body: '{}',
        }),
      )
      .then((data) => {
        if (!cancelled) setConversationId(data.conversation.id)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setStarting(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, conversationId, open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pendingReply, starting])

  async function handleSend(event: FormEvent) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !conversationId || pendingReply || starting) return
    const optimisticId = newLocalId()
    setMessages((current) => [...current, { id: optimisticId, role: 'user', content }])
    setDraft('')
    setPendingReply(true)
    setError(null)
    try {
      const token = await resolveAiAccessToken(accessToken)
      const result = await aiFetch<{
        userMessage: ChatLine
        assistantMessage: ChatLine
      }>(`/conversations/${conversationId}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticId),
        result.userMessage,
        result.assistantMessage,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('assistantFailed'))
    } finally {
      setPendingReply(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <AppEndPanel
      title={t('assistantTitle')}
      onClose={onClose}
      closeLabel={t('assistantClose')}
      footer={
        <>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <form className="flex flex-col gap-2" onSubmit={(event) => void handleSend(event)}>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('assistantPlaceholder')}
              rows={2}
              disabled={starting || !conversationId}
            />
            <Button
              type="submit"
              disabled={starting || pendingReply || !conversationId || !draft.trim()}
            >
              <span className="inline-flex items-center gap-2">
                {pendingReply ? <Spinner size="sm" /> : null}
                {t('assistantSend')}
              </span>
            </Button>
          </form>
        </>
      }
    >
      <p className="text-xs text-muted-foreground">{t('assistantHint')}</p>
      <div className="flex flex-col gap-3" aria-live="polite">
        {starting && messages.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span>{t('assistantStarting')}</span>
          </div>
        ) : null}
        {messages.map((message) => {
          const resultRecords =
            message.resultRecords && message.resultRecords.length > 0
              ? message.resultRecords
              : parseRecordsFromText(message.content)
          const text = visibleAssistantText(message.content, resultRecords)
          return (
            <div
              key={message.id}
              className={cn(
                'max-w-[90%] space-y-1 rounded-lg px-3 py-2 text-sm',
                message.role === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-muted/70',
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">
                {message.role === 'user' ? t('assistantYou') : t('assistantName')}
              </p>
              {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
              {resultRecords.length > 0 ? <RecordResultList records={resultRecords} /> : null}
            </div>
          )
        })}
        {pendingReply ? (
          <div className="mr-auto flex max-w-[90%] items-center gap-2 rounded-lg bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span>{t('assistantThinking')}</span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </AppEndPanel>
  )
}
