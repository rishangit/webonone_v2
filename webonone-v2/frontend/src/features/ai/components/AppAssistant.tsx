import { type FormEvent, type KeyboardEvent, type SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { PlatformAiEntityRef } from '@webonone/platform-embed'
import {
  AppEndPanel,
  Button,
  ConfirmItemList,
  Spinner,
  Textarea,
  cn,
  type ConfirmDisplayField,
  type ConfirmItemDecision,
  type ConfirmRelatedNode,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { aiFetch } from '@/features/ai/utils/aiClient'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'
import { searchDataEntities, type DataEntitySearchHit } from '@/features/ai/utils/dataEntitySearch'
import { formatEntityTag, insertTextAtCursor } from '@/features/ai/utils/formatEntityTag'
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
  displayFields?: ConfirmDisplayField[]
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
  displayFields?: ConfirmDisplayField[]
  relatedTree?: ConfirmRelatedNode[]
  status: PendingCallStatus
  calls?: PendingToolCall[]
}

type ChatLine = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pendingTool?: PendingTool | null
  resultRecords?: Record<string, unknown>[]
  context?: PlatformAiEntityRef[]
}

function entityRefKey(ref: PlatformAiEntityRef): string {
  return `${ref.service}:${ref.kind}:${ref.id}`
}

function addEntityRef(refs: PlatformAiEntityRef[], ref: PlatformAiEntityRef): PlatformAiEntityRef[] {
  const key = entityRefKey(ref)
  if (refs.some((item) => entityRefKey(item) === key)) {
    return refs
  }
  return [...refs, ref]
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
  const { consumePendingEntity, pasteVersion } = useAiEntityPaste()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const catalogKind = useAppSelector((s) => s.companyCatalog.kind)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [attachedContext, setAttachedContext] = useState<PlatformAiEntityRef[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionHits, setMentionHits] = useState<DataEntitySearchHit[]>([])
  const [mentionLoading, setMentionLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [pendingReply, setPendingReply] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const selectionRef = useRef({ start: 0, end: 0 })

  const insertEntityTagAtCursor = useCallback(
    (entity: PlatformAiEntityRef, options?: { atEnd?: boolean }) => {
      const tag = formatEntityTag(entity.kind, entity.label)
      setDraft((currentDraft) => {
        const start = options?.atEnd ? currentDraft.length : selectionRef.current.start
        const end = options?.atEnd ? currentDraft.length : selectionRef.current.end
        const { next, caret } = insertTextAtCursor(currentDraft, tag, start, end)
        selectionRef.current = { start: caret, end: caret }
        requestAnimationFrame(() => {
          const textarea = textareaRef.current
          if (!textarea) return
          textarea.focus()
          textarea.setSelectionRange(caret, caret)
        })
        return next
      })
      setAttachedContext((current) => addEntityRef(current, entity))
    },
    [],
  )

  useEffect(() => {
    if (!open) return
    const pending = consumePendingEntity()
    if (!pending) return
    insertEntityTagAtCursor(pending, { atEnd: true })
  }, [open, pasteVersion, consumePendingEntity, insertEntityTagAtCursor])

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

  useEffect(() => {
    if (!accessToken || mentionQuery === null) {
      setMentionHits([])
      return
    }
    let cancelled = false
    setMentionLoading(true)
    searchDataEntities(accessToken, mentionQuery)
      .then((hits) => {
        if (!cancelled) setMentionHits(hits)
      })
      .catch(() => {
        if (!cancelled) setMentionHits([])
      })
      .finally(() => {
        if (!cancelled) setMentionLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, mentionQuery])

  function syncMentionQuery(value: string, cursor: number) {
    const before = value.slice(0, cursor)
    const at = before.lastIndexOf('@')
    if (at < 0) {
      setMentionQuery(null)
      return
    }
    const fragment = before.slice(at + 1)
    if (fragment.includes(' ') || fragment.includes('\n')) {
      setMentionQuery(null)
      return
    }
    setMentionQuery(fragment)
  }

  function handleDraftChange(value: string) {
    setDraft(value)
    const cursor = textareaRef.current?.selectionStart ?? value.length
    syncMentionQuery(value, cursor)
  }

  function handleComposerSelect(event: SyntheticEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget
    selectionRef.current = {
      start: target.selectionStart ?? 0,
      end: target.selectionEnd ?? 0,
    }
    syncMentionQuery(target.value, target.selectionStart ?? 0)
  }

  function handleMentionPick(hit: DataEntitySearchHit) {
    const entity: PlatformAiEntityRef = {
      service: 'data',
      kind: hit.kind,
      id: hit.id,
      label: hit.label,
    }
    const cursor = selectionRef.current.start
    const before = draft.slice(0, cursor)
    const at = before.lastIndexOf('@')
    setMentionQuery(null)
    if (at >= 0) {
      const after = draft.slice(cursor)
      const restored = `${draft.slice(0, at)}${after}`
      selectionRef.current = { start: at, end: at }
      setDraft(restored)
      requestAnimationFrame(() => insertEntityTagAtCursor(entity))
      return
    }
    insertEntityTagAtCursor(entity)
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !conversationId || !accessToken || pendingReply || starting) return
    const context = attachedContext
    const optimisticId = newLocalId()
    setMessages((current) => [...current, { id: optimisticId, role: 'user', content }])
    setDraft('')
    setAttachedContext([])
    setMentionQuery(null)
    setPendingReply(true)
    setError(null)
    try {
      const result = await aiFetch<{
        userMessage: ChatLine
        assistantMessage: ChatLine
      }>(`/conversations/${conversationId}/messages`, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          content,
          ...(context.length > 0 ? { context } : {}),
        }),
      })
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticId),
        result.userMessage,
        result.assistantMessage,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('assistant.failed'))
      setAttachedContext(context)
      setDraft(content)
    } finally {
      setPendingReply(false)
    }
  }

  async function handleToolDecision(
    toolCallId: string,
    action: 'confirm' | 'reject',
    decision?: ConfirmItemDecision,
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
              ? JSON.stringify({
                  relatedSelections: decision?.relatedSelections ?? {},
                  argumentOverrides: decision?.argumentOverrides,
                  relatedArgumentOverrides: decision?.relatedArgumentOverrides,
                })
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
          <form className="relative flex flex-col gap-2" onSubmit={(event) => void handleSend(event)}>
            {mentionQuery !== null ? (
              <div className="absolute bottom-full left-0 right-0 z-10 mb-1 max-h-48 overflow-y-auto rounded-md border border-[hsl(var(--glass-border))] bg-background p-1 shadow-md">
                {mentionLoading ? (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">{t('assistant.mentionLoading')}</p>
                ) : mentionHits.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">{t('assistant.mentionEmpty')}</p>
                ) : (
                  mentionHits.map((hit) => (
                    <button
                      key={`${hit.kind}:${hit.id}`}
                      type="button"
                      className="flex w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        handleMentionPick(hit)
                      }}
                    >
                      <span className="text-muted-foreground">{hit.kind}</span>
                      <span className="mx-1">·</span>
                      <span className="truncate">{hit.label}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onSelect={handleComposerSelect}
              onKeyUp={handleComposerSelect}
              onClick={handleComposerSelect}
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
                    displayFields: call.displayFields,
                    relatedTree: call.relatedTree,
                    confirmedLabel: t('assistant.itemAdded', { name: callItemName(call) }),
                    canceledLabel: t('assistant.itemCanceled', { name: callItemName(call) }),
                  }))}
                  pendingHint={hasPending ? t('assistant.pendingChange') : undefined}
                  confirmLabel={t('assistant.confirm')}
                  skipLabel={t('assistant.skip')}
                  disabled={pendingReply}
                  onConfirm={(toolCallId, decision) =>
                    void handleToolDecision(toolCallId, 'confirm', decision)
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
