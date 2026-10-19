import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppEndPanel,
  Button,
  ConfirmItemList,
  Spinner,
  Textarea,
  cn,
  type ConfirmItemDecision,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { aiFetch } from '@/features/ai/utils/aiClient'
import { getWebOnOneOrigin } from '@/features/auth/utils/identityConfig'
import { getAddonModuleByType } from '../addons/registry'
import { findBlock } from '../document/blockTree'
import { blockTreeLabel } from '../document/contentTreeModel'
import {
  formatDesignerCanvasContext,
  visibleDesignerChatText,
  type CanvasApplyResult,
} from '../document/applyCanvas'
import { findBlockInTree } from '../document/slider'
import type { DesignerSelection, WebsiteAddon, WebsiteBlock, WebsiteDocumentV1 } from '../types'

type PendingCallStatus = 'pending_confirmation' | 'confirmed' | 'rejected'

type PendingToolCall = {
  toolCallId: string
  name: string
  displayKind?: string
  riskLevel: string
  summary: string
  arguments: Record<string, unknown>
  displayArguments?: Record<string, unknown>
  status: PendingCallStatus
}

type PendingTool = {
  toolCallId: string
  name: string
  displayKind?: string
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
}

const CANVAS_TOOLS = new Set(['apply_design_canvas', 'apply_design_library_canvas'])

type DesignerAssistantPanelProps = {
  kind: string
  entityId: string
  entityName: string
  document: WebsiteDocumentV1
  focus: DesignerSelection | null
  onApplyCanvas: (args: Record<string, unknown>) => CanvasApplyResult
  onClearFocus: () => void
  onClose: () => void
}

function addonName(addon: WebsiteAddon, t: (key: string) => string): string {
  const module = getAddonModuleByType(addon.type)
  const name = module ? t(module.labelKey) : addon.type
  if (addon.type === 'text' && addon.props.content.trim()) return `${name}: ${addon.props.content.trim().slice(0, 40)}`
  if (addon.type === 'button' && addon.props.label.trim()) return `${name}: ${addon.props.label.trim().slice(0, 40)}`
  return name
}

function templateRoot(document: WebsiteDocumentV1, hostBlockId: string, sliderAddonId: string): WebsiteBlock | null {
  const slider = findBlock(document, hostBlockId)?.addons.find((addon) => addon.id === sliderAddonId)
  if (!slider || slider.type !== 'slider' || !slider.props.slideTemplate) return null
  return slider.props.slideTemplate
}

function focusName(
  document: WebsiteDocumentV1,
  focus: Exclude<DesignerSelection, { kind: 'container' }>,
  t: (key: string) => string,
): string {
  if (focus.kind === 'block') {
    const block = findBlock(document, focus.blockId)
    return block ? blockTreeLabel(block, t('block')) : t('block')
  }
  if (focus.kind === 'addon') {
    const addon = findBlock(document, focus.blockId)?.addons.find((item) => item.id === focus.addonId)
    return addon ? addonName(addon, t) : t('addAddon')
  }
  const root = templateRoot(document, focus.hostBlockId, focus.sliderAddonId)
  const block = root ? findBlockInTree(root, focus.templateBlockId) : null
  if (focus.kind === 'templateBlock') return block ? blockTreeLabel(block, t('block')) : t('block')
  const addon = block?.addons.find((item) => item.id === focus.templateAddonId)
  return addon ? addonName(addon, t) : t('addAddon')
}

function newLocalId() {
  return `local-${crypto.randomUUID()}`
}

function pendingRows(pending: PendingTool): PendingToolCall[] {
  if (pending.calls && pending.calls.length > 0) return pending.calls
  return [
    {
      toolCallId: pending.toolCallId,
      name: pending.name,
      displayKind: pending.displayKind,
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
  return typeof name === 'string' && name.trim() ? name.trim() : call.summary || 'Change'
}

function toolNameForCall(pending: PendingTool, toolCallId: string): string | null {
  const row = pending.calls?.find((call) => call.toolCallId === toolCallId)
  if (row) return row.name
  if (pending.toolCallId === toolCallId) return pending.name
  return null
}

function toolArgsForCall(pending: PendingTool, toolCallId: string): Record<string, unknown> | undefined {
  const row = pending.calls?.find((call) => call.toolCallId === toolCallId)
  if (row) return row.arguments
  if (pending.toolCallId === toolCallId) return pending.arguments
  return undefined
}

export function DesignerAssistantPanel({
  kind,
  entityId,
  entityName,
  document,
  focus,
  onApplyCanvas,
  onClearFocus,
  onClose,
}: DesignerAssistantPanelProps) {
  const { t } = useTranslation('website')
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [starting, setStarting] = useState(false)
  const [pendingReply, setPendingReply] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const [expanded, setExpanded] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef({ kind, entityId, entityName, document, focus })
  canvasRef.current = { kind, entityId, entityName, document, focus }

  useEffect(() => {
    setConversationId(null)
    setMessages([])
    setAiConfigured(null)
  }, [accessToken, entityId])

  useEffect(() => {
    if (!accessToken) return
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
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || conversationId || aiConfigured !== true) return
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
  }, [accessToken, aiConfigured, conversationId])

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
    const canvas = canvasRef.current
    const payload = `${formatDesignerCanvasContext({
      kind: canvas.kind,
      id: canvas.entityId,
      name: canvas.entityName,
      document: canvas.document,
      focus: canvas.focus,
    })}\n\n${content}`
    const optimisticId = newLocalId()
    setMessages((current) => [...current, { id: optimisticId, role: 'user', content }])
    setDraft('')
    setPendingReply(true)
    setError(null)
    try {
      const result = await aiFetch<{ userMessage: ChatLine; assistantMessage: ChatLine }>(
        `/conversations/${conversationId}/messages`,
        accessToken,
        { method: 'POST', body: JSON.stringify({ content: payload }) },
      )
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticId),
        result.userMessage,
        result.assistantMessage,
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('designerAssistant.failed'))
      setDraft(content)
    } finally {
      setPendingReply(false)
    }
  }

  async function handleToolDecision(toolCallId: string, action: 'confirm' | 'reject', decision?: ConfirmItemDecision) {
    if (!conversationId || !accessToken || pendingReply) return
    const pendingName = messages
      .map((message) => (message.pendingTool ? toolNameForCall(message.pendingTool, toolCallId) : null))
      .find((name): name is string => Boolean(name))
    const pendingArgs = messages
      .map((message) => (message.pendingTool ? toolArgsForCall(message.pendingTool, toolCallId) : undefined))
      .find((args): args is Record<string, unknown> => Boolean(args))
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
                })
              : '{}',
        },
      )
      setMessages((current) => {
        const returned = result.assistantMessage
        const exists = current.some((message) => message.id === returned.id)
        if (exists) return current.map((message) => (message.id === returned.id ? returned : message))
        return [...current, returned]
      })
      if (action === 'confirm' && pendingName && CANVAS_TOOLS.has(pendingName) && pendingArgs) {
        onApplyCanvas(pendingArgs)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('designerAssistant.failed'))
    } finally {
      setPendingReply(false)
    }
  }

  if (!accessToken) return null

  const settingsUrl = `${getWebOnOneOrigin()}/settings/basic?tab=ai`
  const composerDisabled = starting || settingsLoading || aiConfigured !== true || !conversationId

  return (
    <AppEndPanel
      title={t('designerAssistant.title')}
      onClose={onClose}
      closeLabel={t('designerAssistant.close')}
      mobileFullWidth
      expandable
      expanded={expanded}
      onExpandedChange={setExpanded}
      expandLabel={t('designerAssistant.expand')}
      collapseLabel={t('designerAssistant.collapse')}
      footer={
        <>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <form className="flex flex-col gap-2" onSubmit={(event) => void handleSend(event)}>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={t('designerAssistant.placeholder')}
              rows={2}
              disabled={composerDisabled}
            />
            <Button type="submit" disabled={composerDisabled || pendingReply || !draft.trim()}>
              <span className="inline-flex items-center gap-2">
                {pendingReply ? <Spinner size="sm" /> : null}
                {t('designerAssistant.send')}
              </span>
            </Button>
          </form>
        </>
      }
    >
      {focus && focus.kind !== 'container' ? (
        <div className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs">
          <span className="min-w-0 truncate">{t('designerAssistant.usingElement', { name: focusName(document, focus, t) })}</span>
          <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2" onClick={onClearFocus}>
            {t('designerAssistant.clearElement')}
          </Button>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">{t('designerAssistant.hint')}</p>
      {settingsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner size="sm" />
          <span>{t('designerAssistant.checkingSettings')}</span>
        </div>
      ) : aiConfigured === false ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{t('designerAssistant.setupRequired')}</p>
          <Button asChild variant="outline" className="w-full">
            <a href={settingsUrl} target="_top" rel="noreferrer">
              {t('designerAssistant.openSettings')}
            </a>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3" aria-live="polite">
          {starting && messages.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="sm" />
              <span>{t('designerAssistant.starting')}</span>
            </div>
          ) : null}
          {messages.map((message) => {
            const pending = message.pendingTool
            const rows = pending ? pendingRows(pending) : []
            const hasPending = rows.some((call) => call.status === 'pending_confirmation')
            const text =
              message.role === 'user' ? visibleDesignerChatText(message.content) : message.content.trim()
            return (
              <div
                key={message.id}
                className={cn(
                  'max-w-[90%] space-y-1 rounded-lg px-3 py-2 text-sm',
                  message.role === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-muted/70',
                )}
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {message.role === 'user' ? t('designerAssistant.you') : t('designerAssistant.name')}
                </p>
                {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
                {rows.length > 0 ? (
                  <ConfirmItemList
                    items={rows.map((call) => ({
                      id: call.toolCallId,
                      status: call.status,
                      itemTypeLabel: call.displayKind,
                      record:
                        call.displayArguments && Object.keys(call.displayArguments).length > 0
                          ? call.displayArguments
                          : call.arguments && Object.keys(call.arguments).length > 0
                            ? call.arguments
                            : { summary: call.summary },
                      confirmedLabel: t('designerAssistant.itemAdded', { name: callItemName(call) }),
                      canceledLabel: t('designerAssistant.itemCanceled', { name: callItemName(call) }),
                    }))}
                    pendingHint={hasPending ? t('designerAssistant.pendingChange') : undefined}
                    confirmLabel={t('designerAssistant.confirm')}
                    skipLabel={t('designerAssistant.cancelChange')}
                    disabled={pendingReply}
                    onConfirm={(id, decision) => void handleToolDecision(id, 'confirm', decision)}
                    onSkip={(id) => void handleToolDecision(id, 'reject')}
                  />
                ) : null}
              </div>
            )
          })}
          {pendingReply ? (
            <div className="mr-auto flex max-w-[90%] items-center gap-2 rounded-lg bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
              <Spinner size="sm" />
              <span>{t('designerAssistant.thinking')}</span>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      )}
    </AppEndPanel>
  )
}
