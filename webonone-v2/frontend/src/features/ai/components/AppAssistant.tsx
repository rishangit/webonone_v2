import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AppEndPanel,
  Button,
  ConfirmItemList,
  Spinner,
  Textarea,
  cn,
  type ConfirmRelatedNode,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { aiFetch } from '@/features/ai/utils/aiClient'
import { notifyPeerAiMutation } from '@/features/ai/utils/notifyPeerAiMutation'
import {
  RecordResultList,
  parseRecordsFromText,
  readRecordOpen,
  visibleAssistantText,
  webononePathForOpen,
} from '@/features/ai/utils/recordView'
import { getWebsiteOrigin } from '@/features/auth/utils/websiteConfig'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'

type PendingCallStatus = 'pending_confirmation' | 'confirmed' | 'rejected'

type PendingToolCall = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments: Record<string, unknown>
  displayArguments?: Record<string, unknown>
  relatedTree?: ConfirmRelatedNode[]
  status: PendingCallStatus
}

type PendingTool = {
  toolCallId: string
  name: string
  riskLevel: string
  summary: string
  arguments?: Record<string, unknown>
  displayArguments?: Record<string, unknown>
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
      displayArguments: pending.displayArguments,
      status: pending.status,
    },
  ]
}

function callItemName(call: PendingToolCall): string {
  const name = call.arguments?.name
  return typeof name === 'string' && name.trim() ? name.trim() : 'Item'
}

const OLLAMA_HOME_URL = 'https://ollama.com'
const OLLAMA_KEYS_URL = 'https://ollama.com/settings/keys'
const AI_SETTINGS_PATH = '/settings/basic?tab=ai'
const setupLinkClassName = 'text-primary underline-offset-4 hover:underline'

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
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const catalogKind = useAppSelector((s) => s.companyCatalog.kind)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [starting, setStarting] = useState(false)
  const [pendingReply, setPendingReply] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setConversationId(null)
    setMessages([])
    setAiConfigured(null)
  }, [accessToken])

  useEffect(() => {
    if (!open || !accessToken) return
    let cancelled = false
    setSettingsLoading(true)
    aiFetch<{ configured: boolean }>('/me/ai-settings', accessToken)
      .then((data) => {
        if (!cancelled) setAiConfigured(data.configured)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setSettingsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, open])

  useEffect(() => {
    if (!open || !accessToken || conversationId || aiConfigured !== true) return
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
  }, [accessToken, aiConfigured, conversationId, open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pendingReply, starting])

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

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

  async function handleToolDecision(
    toolCallId: string,
    action: 'confirm' | 'reject',
    relatedSelections?: Record<string, boolean>,
  ) {
    if (!conversationId || !accessToken || pendingReply) return
    const pendingName = messages
      .map((message) => (message.pendingTool ? toolNameForCall(message.pendingTool, toolCallId) : null))
      .find((name): name is string => Boolean(name))
    setPendingReply(true)
    setError(null)
    try {
      const result = await aiFetch<{ assistantMessage: ChatLine }>(
        `/conversations/${conversationId}/tool-calls/${encodeURIComponent(toolCallId)}/${
          action === 'confirm' ? 'confirm' : 'reject'
        }`,
        accessToken,
        {
          method: 'POST',
          body:
            action === 'confirm'
              ? JSON.stringify({ relatedSelections: relatedSelections ?? {} })
              : '{}',
        },
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
              onKeyDown={handleComposerKeyDown}
              placeholder={t('assistant.placeholder')}
              rows={2}
              disabled={starting || settingsLoading || aiConfigured !== true || !conversationId}
            />
            <Button
              type="submit"
              disabled={starting || pendingReply || settingsLoading || aiConfigured !== true || !conversationId || !draft.trim()}
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
      {settingsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          <span>{t('assistant.checkingSettings')}</span>
        </div>
      ) : aiConfigured === false ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{t('assistant.setupRequired')}</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              {t('assistant.setupStep1')}{' '}
              <a href={OLLAMA_HOME_URL} target="_blank" rel="noreferrer" className={setupLinkClassName}>
                ollama.com
              </a>
            </li>
            <li>
              {t('assistant.setupStep2')}{' '}
              <a href={OLLAMA_KEYS_URL} target="_blank" rel="noreferrer" className={setupLinkClassName}>
                ollama.com/settings/keys
              </a>
            </li>
            <li>
              {t('assistant.setupStep3')}{' '}
              <Link to={AI_SETTINGS_PATH} className={setupLinkClassName} onClick={onClose}>
                {t('assistant.setupSettingsLink')}
              </Link>
            </li>
          </ol>
          <Button asChild variant="outline" className="w-full">
            <Link to={AI_SETTINGS_PATH} onClick={onClose}>
              {t('assistant.openSettings')}
            </Link>
          </Button>
        </div>
      ) : (
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
                <RecordResultList
                  records={resultRecords}
                  openLabel={t('assistant.openRecord')}
                  hrefForRecord={(record) => {
                    const open = readRecordOpen(record)
                    if (!open) return null
                    if (open.path.startsWith('/catalog/')) {
                      return `${getWebsiteOrigin()}${open.path}`
                    }
                    return webononePathForOpen(open)
                  }}
                  onOpen={(href) => {
                    if (/^https?:\/\//i.test(href)) {
                      window.location.assign(href)
                      return
                    }
                    onClose()
                    navigate(href)
                  }}
                />
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
                    relatedTree: call.relatedTree,
                    confirmedLabel: t('assistant.itemAdded', { name: callItemName(call) }),
                    canceledLabel: t('assistant.itemCanceled', { name: callItemName(call) }),
                  }))}
                  pendingHint={hasPending ? t('assistant.pendingChange') : undefined}
                  confirmLabel={t('assistant.confirm')}
                  skipLabel={t('assistant.skip')}
                  disabled={pendingReply}
                  onConfirm={(toolCallId, selections) =>
                    void handleToolDecision(toolCallId, 'confirm', selections)
                  }
                  onSkip={(toolCallId) => void handleToolDecision(toolCallId, 'reject')}
                />
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
      )}
    </AppEndPanel>
  )
}
