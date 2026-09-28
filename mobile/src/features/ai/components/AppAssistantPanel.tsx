import { useCallback, useEffect, useRef, useState } from 'react'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { PlatformAiEntityRef } from '@webonone/platform-embed'
import {
  AppEndPanel,
  Body,
  Button,
  Muted,
  Spinner,
  Textarea,
} from '@webonone/mobile-ui'
import {
  PendingAssistantToolCalls,
  toolNameForCall,
  type PendingTool,
} from '@/features/ai/components/PendingAssistantToolCalls'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'
import { aiFetch } from '@/features/ai/utils/aiClient'
import { emitAiCompanyCatalogRefresh } from '@/features/ai/utils/aiCatalogEvents'
import {
  isCompanyCatalogWriteTool,
  isDataAttributeValueWriteTool,
  isDataProductVariantWriteTool,
} from '@/features/ai/utils/catalogAiMutationRefresh'
import { searchDataEntities, type DataEntitySearchHit } from '@/features/ai/utils/dataEntitySearch'
import {
  formatEntityTag,
  insertTextAtCursor,
} from '@/features/ai/utils/formatEntityTag'
import { secureStorage } from '@/shared/services/secureStorage'

type ChatLine = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pendingTool?: PendingTool | null
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

type AppAssistantPanelProps = {
  open: boolean
  onClose: () => void
}

function newLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const OLLAMA_HOME_URL = 'https://ollama.com'
const OLLAMA_KEYS_URL = 'https://ollama.com/settings/keys'

export function AppAssistantPanel({ open, onClose }: AppAssistantPanelProps) {
  const { t } = useTranslation('shell')
  const router = useRouter()
  const { consumePendingEntity, pasteVersion } = useAiEntityPaste()
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
  const scrollRef = useRef<ScrollView>(null)
  const selectionRef = useRef({ start: 0, end: 0 })

  const insertEntityTagAtCursor = useCallback((entity: PlatformAiEntityRef, atEnd?: boolean) => {
    const tag = formatEntityTag(entity)
    setDraft((currentDraft) => {
      const start = atEnd ? currentDraft.length : selectionRef.current.start
      const end = atEnd ? currentDraft.length : selectionRef.current.end
      const { next, caret } = insertTextAtCursor(currentDraft, tag, start, end)
      selectionRef.current = { start: caret, end: caret }
      return next
    })
    setAttachedContext((current) => addEntityRef(current, entity))
  }, [])

  useEffect(() => {
    if (!open) {
      setConversationId(null)
      setMessages([])
      setDraft('')
      setAttachedContext([])
      setMentionQuery(null)
      setError(null)
      setAiConfigured(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const pending = consumePendingEntity()
    if (!pending) return
    pending.entities.forEach((entity, index) => {
      insertEntityTagAtCursor(entity, index > 0 || Boolean(pending.composerText))
    })
    if (pending.composerText) {
      setDraft((current) => {
        const trimmed = current.trimEnd()
        const prefix = trimmed.length > 0 ? `${trimmed} ` : ''
        return `${prefix}${pending.composerText}`
      })
    }
  }, [open, pasteVersion, consumePendingEntity, insertEntityTagAtCursor])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setSettingsLoading(true)
    aiFetch<{ configured: boolean }>('/me/ai-settings')
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
  }, [open])

  useEffect(() => {
    if (!open || conversationId || aiConfigured !== true) return
    let cancelled = false
    setStarting(true)
    aiFetch<{ conversation: { id: string } }>('/conversations', {
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
  }, [aiConfigured, conversationId, open])

  useEffect(() => {
    if (mentionQuery === null) {
      setMentionHits([])
      return
    }
    let cancelled = false
    setMentionLoading(true)
    void secureStorage
      .getAccessToken()
      .then((token) => {
        if (!token) return []
        return searchDataEntities(token, mentionQuery)
      })
      .then((hits) => {
        if (!cancelled) setMentionHits(hits ?? [])
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
  }, [mentionQuery])

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
    syncMentionQuery(value, selectionRef.current.start)
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
      insertEntityTagAtCursor(entity)
      return
    }
    insertEntityTagAtCursor(entity)
  }

  const handleSend = useCallback(async () => {
    const content = draft.trim()
    if (!content || !conversationId || pendingReply || starting) return
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
      }>(`/conversations/${conversationId}/messages`, {
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
  }, [attachedContext, conversationId, draft, pendingReply, starting, t])

  const handleToolDecision = useCallback(
    async (toolCallId: string, action: 'confirm' | 'reject') => {
      if (!conversationId || pendingReply) return
      const pendingMessage = messages.find((message) => message.pendingTool)
      const pendingTool = pendingMessage?.pendingTool
      const pendingName = pendingTool ? toolNameForCall(pendingTool, toolCallId) : null
      setPendingReply(true)
      setError(null)
      try {
        const result = await aiFetch<{ assistantMessage: ChatLine }>(
          `/conversations/${conversationId}/tool-calls/${encodeURIComponent(toolCallId)}/${
            action === 'confirm' ? 'confirm' : 'reject'
          }`,
          {
            method: 'POST',
            body: '{}',
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
          if (
            isCompanyCatalogWriteTool(pendingName) ||
            isDataAttributeValueWriteTool(pendingName) ||
            isDataProductVariantWriteTool(pendingName)
          ) {
            emitAiCompanyCatalogRefresh(pendingName)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('assistant.failed'))
      } finally {
        setPendingReply(false)
      }
    },
    [conversationId, messages, pendingReply, t],
  )

  function openAiSettings() {
    onClose()
    router.push('/settings/basic?tab=ai' as Href)
  }

  const footer = (
    <View className="gap-2 p-4">
      {error ? <Body className="text-xs text-destructive">{error}</Body> : null}
      <View className="relative">
        {mentionQuery !== null ? (
          <View className="absolute bottom-full left-0 right-0 z-10 mb-1 max-h-48 rounded-md border border-border bg-background p-1">
            {mentionLoading ? (
              <Muted className="px-2 py-1.5 text-xs">{t('assistant.mentionLoading')}</Muted>
            ) : mentionHits.length === 0 ? (
              <Muted className="px-2 py-1.5 text-xs">{t('assistant.mentionEmpty')}</Muted>
            ) : (
              mentionHits.map((hit) => (
                <Pressable
                  key={`${hit.kind}:${hit.id}`}
                  className="rounded-sm px-2 py-1.5"
                  onPress={() => handleMentionPick(hit)}
                >
                  <Body className="text-sm">
                    <Muted>{hit.kind}</Muted>
                    {' · '}
                    {hit.label}
                  </Body>
                </Pressable>
              ))
            )}
          </View>
        ) : null}
        <Textarea
          value={draft}
          onChangeText={handleDraftChange}
          onSelectionChange={(event) => {
            selectionRef.current = {
              start: event.nativeEvent.selection.start,
              end: event.nativeEvent.selection.end,
            }
            syncMentionQuery(draft, event.nativeEvent.selection.start)
          }}
          placeholder={t('assistant.placeholder')}
          editable={!starting && !settingsLoading && aiConfigured === true && Boolean(conversationId)}
        />
      </View>
      <Button
        onPress={() => void handleSend()}
        disabled={
          starting ||
          pendingReply ||
          settingsLoading ||
          aiConfigured !== true ||
          !conversationId ||
          !draft.trim()
        }
      >
        {pendingReply ? t('assistant.thinking') : t('assistant.send')}
      </Button>
    </View>
  )

  return (
    <AppEndPanel
      open={open}
      onClose={onClose}
      title={t('assistant.title')}
      closeLabel={t('assistant.close')}
      footer={footer}
      mobileFullWidth
    >
      <Muted className="text-xs">{t('assistant.hint')}</Muted>
      {settingsLoading ? (
        <View className="flex-row items-center gap-2">
          <Spinner size="small" />
          <Muted className="text-sm">{t('assistant.checkingSettings')}</Muted>
        </View>
      ) : null}
      {aiConfigured === false ? (
        <View className="gap-3">
          <Muted className="text-sm">{t('assistant.setupRequired')}</Muted>
          <Muted className="text-sm">1. {t('assistant.setupStep1')}</Muted>
          <Button variant="outline" size="sm" onPress={() => void Linking.openURL(OLLAMA_HOME_URL)}>
            ollama.com
          </Button>
          <Muted className="text-sm">2. {t('assistant.setupStep2')}</Muted>
          <Button variant="outline" size="sm" onPress={() => void Linking.openURL(OLLAMA_KEYS_URL)}>
            ollama.com/settings/keys
          </Button>
          <Muted className="text-sm">3. {t('assistant.setupStep3')}</Muted>
          <Button variant="outline" onPress={openAiSettings}>
            {t('assistant.openSettings')}
          </Button>
        </View>
      ) : (
        <ScrollView ref={scrollRef} onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
          <View className="gap-3">
            {starting && messages.length === 0 ? (
              <View className="flex-row items-center gap-2">
                <Spinner size="small" />
                <Muted className="text-sm">{t('assistant.starting')}</Muted>
              </View>
            ) : null}
            {messages.map((message) => (
              <View
                key={message.id}
                className={`max-w-[90%] gap-1 rounded-lg px-3 py-2 ${
                  message.role === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-muted/70'
                }`}
              >
                <Muted className="text-xs font-medium">
                  {message.role === 'user' ? t('assistant.you') : t('assistant.name')}
                </Muted>
                <Body className="text-sm">{message.content}</Body>
                {message.pendingTool ? (
                  <PendingAssistantToolCalls
                    pending={message.pendingTool}
                    disabled={pendingReply}
                    onConfirm={(toolCallId) => void handleToolDecision(toolCallId, 'confirm')}
                    onSkip={(toolCallId) => void handleToolDecision(toolCallId, 'reject')}
                  />
                ) : null}
              </View>
            ))}
            {pendingReply ? (
              <View className="mr-auto flex-row items-center gap-2 rounded-lg bg-muted/70 px-3 py-2">
                <Spinner size="small" />
                <Muted className="text-sm">{t('assistant.thinking')}</Muted>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </AppEndPanel>
  )
}
