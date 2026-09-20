import { useCallback, useEffect, useRef, useState } from 'react'
import { Linking, ScrollView, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  AppEndPanel,
  Body,
  Button,
  Muted,
  Spinner,
  Textarea,
} from '@webonone/mobile-ui'
import { aiFetch } from '@/features/ai/utils/aiClient'

type ChatLine = {
  id: string
  role: 'user' | 'assistant'
  content: string
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
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [starting, setStarting] = useState(false)
  const [pendingReply, setPendingReply] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (!open) return
    setConversationId(null)
    setMessages([])
    setDraft('')
    setError(null)
    setAiConfigured(null)
  }, [open])

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

  const handleSend = useCallback(async () => {
    const content = draft.trim()
    if (!content || !conversationId || pendingReply || starting) return
    const optimisticId = newLocalId()
    setMessages((current) => [...current, { id: optimisticId, role: 'user', content }])
    setDraft('')
    setPendingReply(true)
    setError(null)
    try {
      const result = await aiFetch<{
        userMessage: ChatLine
        assistantMessage: ChatLine
      }>(`/conversations/${conversationId}/messages`, {
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
      setDraft(content)
    } finally {
      setPendingReply(false)
    }
  }, [conversationId, draft, pendingReply, starting, t])

  function openAiSettings() {
    onClose()
    router.push('/settings/basic?tab=ai' as Href)
  }

  const footer = (
    <View className="gap-2 p-4">
      {error ? <Body className="text-xs text-destructive">{error}</Body> : null}
      <Textarea
        value={draft}
        onChangeText={setDraft}
        placeholder={t('assistant.placeholder')}
        editable={!starting && !settingsLoading && aiConfigured === true && Boolean(conversationId)}
      />
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
