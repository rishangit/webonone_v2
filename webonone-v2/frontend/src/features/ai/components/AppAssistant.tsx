import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppEndPanel,
  Button,
  ItemList,
  ItemListContent,
  ItemListItem,
  Spinner,
  Textarea,
  cn,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { aiFetch } from '@/features/ai/utils/aiClient'
import { notifyPeerAiMutation } from '@/features/ai/utils/notifyPeerAiMutation'
import {
  RecordLines,
  RecordResultList,
  parseRecordsFromText,
  visibleAssistantText,
} from '@/features/ai/utils/recordView'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'

type PendingCallStatus = 'pending_confirmation' | 'confirmed' | 'rejected'

type PendingToolCall = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments: Record<string, unknown>
  status: PendingCallStatus
}

type PendingTool = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments?: Record<string, unknown>
  status: PendingCallStatus
  calls?: PendingToolCall[]
}

type ChatLine = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pendingTool?: PendingTool | null
  resultRecords?: Record<string, unknown>[]
}

type AppAssistantProps = {
  open: boolean
  onClose: () => void
}

function newLocalId() {
  return `local-${crypto.randomUUID()}`
}

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
      arguments: pending.arguments ?? {},
      status: pending.status,
    },
  ]
}

function callItemName(call: PendingToolCall): string {
  const name = call.arguments?.name
  return typeof name === 'string' && name.trim() ? name.trim() : 'Item'
}

function toolNameForCall(pending: PendingTool, toolCallId: string): string | null {
  const row = pending.calls?.find((call) => call.toolCallId === toolCallId)
  if (row) {
    return row.name
  }
  if (pending.toolCallId === toolCallId) {
    return pending.name
  }
  return null
}

export function AppAssistant({ open, onClose }: AppAssistantProps) {
  const { t } = useTranslation('shell')
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const catalogKind = useAppSelector((s) => s.companyCatalog.kind)
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
    if (!open || !accessToken || conversationId) return
    let cancelled = false
    setStarting(true)
    setError(null)
    aiFetch<{ conversation: { id: string } }>('/conversations', accessToken, {
      method: 'POST',
      body: '{}',
    })
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
    if (!content || !conversationId || !accessToken || pendingReply || starting) return
    const optimisticId = newLocalId()
    setMessages((current) => [...current, { id: optimisticId, role: 'user', content }])
    setDraft('')
    setPendingReply(true)
    setError(null)
    try {
      const result = await aiFetch<{
        userMessage: ChatLine
        assistantMessage: ChatLine
      }>(`/conversations/${conversationId}/messages`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticId),
        result.userMessage,
        result.assistantMessage,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('assistant.failed'))
    } finally {
      setPendingReply(false)
    }
  }

  async function handleToolDecision(toolCallId: string, action: 'confirm' | 'reject') {
    if (!conversationId || !accessToken || pendingReply) return
    const pendingName = messages
      .map((message) => (message.pendingTool ? toolNameForCall(message.pendingTool, toolCallId) : null))
      .find((name): name is string => Boolean(name))
    setPendingReply(true)
    setError(null)
    try {
      const result = await aiFetch<{ assistantMessage: ChatLine }>(
        `/conversations/${conversationId}/tool-calls/${encodeURIComponent(toolCallId)}/${action}`,
        accessToken,
        { method: 'POST', body: '{}' },
      )
      setMessages((current) => {
        const returned = result.assistantMessage
        const exists = current.some((message) => message.id === returned.id)
        if (exists) {
          return current.map((message) => (message.id === returned.id ? returned : message))
        }
        return [...current, returned]
      })
      if (action === 'confirm' && pendingName) {
        notifyPeerAiMutation(pendingName)
        if (
          catalogKind &&
          /^(create|update|delete)_catalog_item$|^link_catalog_item$|^from_library_catalog$|^fork_catalog_item$/.test(
            pendingName,
          )
        ) {
          dispatch(companyCatalogActions.listRequested({ kind: catalogKind }))
        }
        if (/^(approve_company|set_company_status)$/.test(pendingName)) {
          dispatch(companiesActions.loadAdminCompaniesRequested({ force: true }))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('assistant.failed'))
    } finally {
      setPendingReply(false)
    }
  }

  if (!accessToken || !open) {
    return null
  }

  return (
    <AppEndPanel
      title={t('assistant.title')}
      onClose={onClose}
      closeLabel={t('assistant.close')}
      footer={
        <>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <form className="flex flex-col gap-2" onSubmit={(event) => void handleSend(event)}>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('assistant.placeholder')}
              rows={2}
              disabled={starting || !conversationId}
            />
            <Button
              type="submit"
              disabled={starting || pendingReply || !conversationId || !draft.trim()}
            >
              <span className="inline-flex items-center gap-2">
                {pendingReply ? <Spinner size="sm" /> : null}
                {t('assistant.send')}
              </span>
            </Button>
          </form>
        </>
      }
    >
      <p className="text-xs text-muted-foreground">{t('assistant.hint')}</p>
      <div className="flex flex-col gap-3" aria-live="polite">
        {starting && messages.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span>{t('assistant.starting')}</span>
          </div>
        ) : null}
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
            <div
              key={message.id}
              className={cn(
                'max-w-[90%] space-y-1 rounded-lg px-3 py-2 text-sm',
                message.role === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-muted/70',
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">
                {message.role === 'user' ? t('assistant.you') : t('assistant.name')}
              </p>
              {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
              {!pending && resultRecords.length > 0 ? (
                <RecordResultList records={resultRecords} />
              ) : null}
              {rows.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {hasPending ? (
                    <p className="text-xs text-muted-foreground">{t('assistant.pendingChange')}</p>
                  ) : null}
                  <ItemList>
                    {rows.map((call) => (
                      <ItemListItem key={call.toolCallId}>
                        <ItemListContent>
                          {call.status === 'confirmed' ? (
                            <p className="truncate text-xs">
                              {t('assistant.itemAdded', { name: callItemName(call) })}
                            </p>
                          ) : call.status === 'rejected' ? (
                            <p className="truncate text-xs">
                              {t('assistant.itemCanceled', { name: callItemName(call) })}
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
                                  disabled={pendingReply}
                                  onClick={() => void handleToolDecision(call.toolCallId, 'confirm')}
                                >
                                  {t('assistant.confirm')}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="link"
                                  className="h-auto px-0"
                                  disabled={pendingReply}
                                  onClick={() => void handleToolDecision(call.toolCallId, 'reject')}
                                >
                                  {t('assistant.cancelChange')}
                                </Button>
                              </div>
                            </>
                          )}
                        </ItemListContent>
                      </ItemListItem>
                    ))}
                  </ItemList>
                </div>
              ) : null}
            </div>
          )
        })}
        {pendingReply ? (
          <div className="mr-auto flex max-w-[90%] items-center gap-2 rounded-lg bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span>{t('assistant.thinking')}</span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </AppEndPanel>
  )
}
