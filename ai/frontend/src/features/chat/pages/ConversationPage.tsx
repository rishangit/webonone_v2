import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  ConfirmItemList,
  FeaturePage,
  FormField,
  Textarea,
  useToast,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { sendMessageSchema } from '@/features/chat/schemas/chatSchemas'
import {
  RecordResultList,
  parseRecordsFromText,
  readRecordOpen,
  visibleAssistantText,
  webononePathForOpen,
} from '@/features/chat/utils/recordView'
import { aiApi } from '@/shared/services/aiApi'
import { getWebOnOneOrigin } from '@/features/auth/utils/identityConfig'
import { redirectToWebOnOnePath } from '@/features/auth/utils/redirectToWebOnOne'
import type { ChatMessage, ConfirmItemDecision, PendingTool, PendingToolCall } from '@/shared/types/ai.types'

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
      displayArguments: pending.displayArguments,
      displayFields: pending.displayFields,
      relatedTree: pending.relatedTree,
      status: pending.status,
    },
  ]
}

function callItemName(call: PendingToolCall): string {
  const name = call.arguments?.name
  return typeof name === 'string' && name.trim() ? name.trim() : 'Item'
}

function findScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node
    }
    node = node.parentElement
  }
  return null
}

function restoreScrollAnchor(toolCallId: string, beforeTop: number | null) {
  if (beforeTop === null) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const anchor = document.querySelector(`[data-confirm-item="${toolCallId}"]`)
      if (!anchor || !(anchor instanceof HTMLElement)) return
      const afterTop = anchor.getBoundingClientRect().top
      const delta = afterTop - beforeTop
      if (delta === 0) return
      const scrollParent = findScrollParent(anchor)
      if (scrollParent) {
        scrollParent.scrollTop += delta
      }
    })
  })
}

const OLLAMA_HOME_URL = 'https://ollama.com'
const OLLAMA_KEYS_URL = 'https://ollama.com/settings/keys'
const AI_SETTINGS_PATH = '/settings/basic?tab=ai'
const setupLinkClassName = 'text-primary underline-offset-4 hover:underline'

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
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const toolDecisionLock = useRef(false)
  usePlatformLoading(loading ? t('loading') : null)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    aiApi
      .getAiSettings()
      .then((settings) => {
        if (!cancelled) setAiConfigured(settings.configured)
      })
      .catch(() => {
        if (!cancelled) setAiConfigured(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !id || aiConfigured !== true) return
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
  }, [accessToken, aiConfigured, id])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  const sessionToken = accessToken

  function openAiSettings() {
    void redirectToWebOnOnePath(sessionToken, AI_SETTINGS_PATH)
  }

  if (aiConfigured === null) {
    return (
      <FeaturePage title={t('chatTitle')}>
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </FeaturePage>
    )
  }

  if (aiConfigured === false) {
    return (
      <FeaturePage title={t('chatTitle')}>
        <Alert>
          <AlertDescription>{t('setupRequired')}</AlertDescription>
        </Alert>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            {t('setupStep1')}{' '}
            <a href={OLLAMA_HOME_URL} target="_blank" rel="noreferrer" className={setupLinkClassName}>
              ollama.com
            </a>
          </li>
          <li>
            {t('setupStep2')}{' '}
            <a href={OLLAMA_KEYS_URL} target="_blank" rel="noreferrer" className={setupLinkClassName}>
              ollama.com/settings/keys
            </a>
          </li>
          <li>
            {t('setupStep3')}{' '}
            <button type="button" className={setupLinkClassName} onClick={openAiSettings}>
              {t('setupSettingsLink')}
            </button>
          </li>
        </ol>
        <Button variant="outline" className="mt-2 w-fit" onClick={openAiSettings}>
          {t('openSettings')}
        </Button>
      </FeaturePage>
    )
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
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
    action: 'confirm' | 'reject',
    decision?: ConfirmItemDecision,
  ) {
    if (!id || toolDecisionLock.current) return
    const anchor = document.querySelector(`[data-confirm-item="${toolCallId}"]`)
    const beforeTop = anchor instanceof HTMLElement ? anchor.getBoundingClientRect().top : null
    toolDecisionLock.current = true
    setSending(true)
    try {
      const result =
        action === 'confirm'
          ? await aiApi.confirmToolCall(id, toolCallId, decision)
          : await aiApi.rejectToolCall(id, toolCallId)
      setMessages((current) => {
        const returned = result.assistantMessage
        const exists = current.some((message) => message.id === returned.id)
        if (exists) {
          return current.map((message) => (message.id === returned.id ? returned : message))
        }
        return [...current, returned]
      })
      restoreScrollAnchor(toolCallId, beforeTop)
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
                    <RecordResultList
                      records={resultRecords}
                      openLabel={t('openRecord')}
                      hrefForRecord={(record) => {
                        const open = readRecordOpen(record)
                        if (!open || open.path.startsWith('/catalog/')) return null
                        return `${getWebOnOneOrigin()}${webononePathForOpen(open)}`
                      }}
                      onOpen={(href) => {
                        try {
                          const path = new URL(href).pathname
                          void redirectToWebOnOnePath(accessToken, path)
                        } catch {
                          window.location.assign(href)
                        }
                      }}
                    />
                  </div>
                ) : null}
                {rows.length > 0 ? (
                  <ConfirmItemList
                    items={rows.map((call) => ({
                      id: call.toolCallId,
                      status: call.status,
                      record:
                        call.displayArguments && Object.keys(call.displayArguments).length > 0
                          ? call.displayArguments
                          : call.arguments && Object.keys(call.arguments).length > 0
                            ? call.arguments
                            : { summary: call.summary },
                      displayFields: call.displayFields,
                      relatedTree: call.relatedTree,
                      confirmedLabel: t('itemAdded', { name: callItemName(call) }),
                      canceledLabel: t('itemCanceled', { name: callItemName(call) }),
                    }))}
                    pendingHint={hasPending ? t('pendingChange') : undefined}
                    confirmLabel={t('confirm')}
                    skipLabel={t('skip')}
                    disabled={sending}
                    onConfirm={(toolCallId, decision) =>
                      void handleToolDecision(toolCallId, 'confirm', decision)
                    }
                    onSkip={(toolCallId) => void handleToolDecision(toolCallId, 'reject')}
                  />
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
              onKeyDown={handleComposerKeyDown}
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
