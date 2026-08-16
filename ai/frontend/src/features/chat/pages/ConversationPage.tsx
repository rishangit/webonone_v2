import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  FormField,
  ItemList,
  ItemListContent,
  ItemListItem,
  Textarea,
  useToast,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { sendMessageSchema } from '@/features/chat/schemas/chatSchemas'
import {
  RecordLines,
  RecordResultList,
  parseRecordsFromText,
  visibleAssistantText,
} from '@/features/chat/utils/recordView'
import { aiApi } from '@/shared/services/aiApi'
import type { ChatMessage, PendingTool, PendingToolCall } from '@/shared/types/ai.types'

function pendingRows(pending: PendingTool): PendingToolCall[] {
  if (pending.calls && pending.calls.length > 0) {
    return pending.calls
  }
  return [
    {
      toolCallId: pending.toolCallId,
      name: pending.name,
      riskLevel: pending.riskLevel,
      summary: pending.summary,
      arguments: pending.arguments,
      status: pending.status,
    },
  ]
}

function callItemName(call: PendingToolCall): string {
  const name = call.arguments?.name
  return typeof name === 'string' && name.trim() ? name.trim() : 'Item'
}

export function ConversationPage() {
  const { t } = useTranslation('chat')
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [title, setTitle] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [missing, setMissing] = useState(false)
  const toolDecisionLock = useRef(false)
  usePlatformLoading(loading ? t('loading') : null)

  useEffect(() => {
    if (!accessToken || !id) return
    let cancelled = false
    setLoading(true)
    Promise.all([aiApi.getConversation(id), aiApi.listMessages(id)])
      .then(([conversation, items]) => {
        if (cancelled) return
        setTitle(conversation.title)
        setMessages(items)
        setMissing(false)
      })
      .catch(() => {
        if (!cancelled) setMissing(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, id])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    const parsed = sendMessageSchema.safeParse({ content })
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.content?.[0])
      return
    }
    setFieldError(undefined)
    setSending(true)
    try {
      const result = await aiApi.sendMessage(id, parsed.data.content)
      setMessages((current) => [...current, result.userMessage, result.assistantMessage])
      setContent('')
      if (!title) {
        setTitle(parsed.data.content.slice(0, 80))
      }
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : t('sendFailed'),
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  async function handleToolDecision(
    toolCallId: string,
    action: 'confirm' | 'reject' | 'rejectRemaining',
  ) {
    if (!id || toolDecisionLock.current) return
    toolDecisionLock.current = true
    setSending(true)
    try {
      const result =
        action === 'confirm'
          ? await aiApi.confirmToolCall(id, toolCallId)
          : await aiApi.rejectToolCall(id, toolCallId, action === 'rejectRemaining')
      setMessages((current) => {
        const returned = result.assistantMessage
        const exists = current.some((message) => message.id === returned.id)
        if (exists) {
          return current.map((message) => (message.id === returned.id ? returned : message))
        }
        return [...current, returned]
      })
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : t('sendFailed'),
        variant: 'destructive',
      })
    } finally {
      toolDecisionLock.current = false
      setSending(false)
    }
  }

  if (missing) {
    return (
      <FeaturePage title={t('chatTitle')}>
        <Alert variant="destructive">
          <AlertDescription>{t('notFound')}</AlertDescription>
        </Alert>
        <Button asChild variant="link" className="mt-4 px-0">
          <Link to="/">{t('back')}</Link>
        </Button>
      </FeaturePage>
    )
  }

  return (
    <FeaturePage
      title={title || t('untitled')}
      actions={
        <Button asChild variant="outline">
          <Link to="/">{t('back')}</Link>
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-border p-4">
          {messages.map((message) => {
            const pending = message.pendingTool
            const rows = pending ? pendingRows(pending) : []
            const hasPending = rows.some((call) => call.status === 'pending_confirmation')
            const resultRecords =
              message.resultRecords && message.resultRecords.length > 0
                ? message.resultRecords
                : parseRecordsFromText(message.content)
            const text = visibleAssistantText(message.content, resultRecords)
            return (
              <div key={message.id} className="max-w-2xl">
                <p className="text-xs font-medium text-muted-foreground">
                  {message.role === 'user' ? t('you') : t('assistant')}
                </p>
                {text ? <p className="whitespace-pre-wrap text-sm">{text}</p> : null}
                {!pending && resultRecords.length > 0 ? (
                  <div className="mt-2">
                    <RecordResultList records={resultRecords} />
                  </div>
                ) : null}
                {rows.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-2">
                    {hasPending ? (
                      <p className="text-xs text-muted-foreground">{t('pendingChange')}</p>
                    ) : null}
                    <ItemList>
                      {rows.map((call) => (
                        <ItemListItem key={call.toolCallId}>
                          <ItemListContent>
                            {call.status === 'confirmed' ? (
                              <p className="truncate text-xs">
                                {t('itemAdded', { name: callItemName(call) })}
                              </p>
                            ) : call.status === 'rejected' ? (
                              <p className="truncate text-xs">
                                {t('itemCanceled', { name: callItemName(call) })}
                              </p>
                            ) : (
                              <>
                                <RecordLines
                                  record={
                                    call.arguments && Object.keys(call.arguments).length > 0
                                      ? call.arguments
                                      : { summary: call.summary }
                                  }
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="link"
                                    className="h-auto px-0"
                                    disabled={sending}
                                    onClick={() => void handleToolDecision(call.toolCallId, 'confirm')}
                                  >
                                    {t('confirm')}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="link"
                                    className="h-auto px-0"
                                    disabled={sending}
                                    onClick={() => void handleToolDecision(call.toolCallId, 'reject')}
                                  >
                                    {t('skip')}
                                  </Button>
                                </div>
                              </>
                            )}
                          </ItemListContent>
                        </ItemListItem>
                      ))}
                    </ItemList>
                    {hasPending && pending ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="link"
                        className="h-auto self-start px-0"
                        disabled={sending}
                        onClick={() => void handleToolDecision(pending.toolCallId, 'rejectRemaining')}
                      >
                        {t('cancelRemaining')}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
        <form className="flex flex-col gap-2" onSubmit={(event) => void handleSend(event)}>
          <FormField label={t('placeholder')} htmlFor="ai-message" error={fieldError} required>
            <Textarea
              id="ai-message"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={sending}
              rows={3}
            />
          </FormField>
          <Button type="submit" disabled={sending || !content.trim()}>
            {t('send')}
          </Button>
        </form>
      </div>
    </FeaturePage>
  )
}
