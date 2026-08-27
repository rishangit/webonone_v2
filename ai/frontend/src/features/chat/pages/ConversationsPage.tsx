import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListAddButton,
  ListPageBody,
  ListPageFooter,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { conversationsActions } from '@/features/chat/store'
import { redirectToWebOnOnePath } from '@/features/auth/utils/redirectToWebOnOne'
import { aiApi } from '@/shared/services/aiApi'
import type { Conversation } from '@/shared/types/ai.types'

const OLLAMA_HOME_URL = 'https://ollama.com'
const OLLAMA_KEYS_URL = 'https://ollama.com/settings/keys'
const AI_SETTINGS_PATH = '/settings/basic?tab=ai'
const setupLinkClassName = 'text-primary underline-offset-4 hover:underline'

export function ConversationsPage() {
  const { t } = useTranslation('chat')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { items, total, page, pageSize, listStatus, listError } = useAppSelector((s) => s.conversations)
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const loading = (listStatus === 'loading' && items.length === 0) || aiConfigured === null
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
    if (!accessToken || aiConfigured !== true) return
    dispatch(conversationsActions.loadListRequested({ page: 1, pageSize: 12, force: true }))
  }, [accessToken, aiConfigured, dispatch])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  const sessionToken = accessToken

  function openAiSettings() {
    void redirectToWebOnOnePath(sessionToken, AI_SETTINGS_PATH)
  }

  if (aiConfigured === null) {
    return (
      <FeaturePage title={t('title')}>
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </FeaturePage>
    )
  }

  if (aiConfigured === false) {
    return (
      <FeaturePage title={t('title')}>
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

  async function handleCreate() {
    try {
      const conversation = await aiApi.createConversation()
      toast({ title: t('created') })
      navigate(`/conversations/${conversation.id}`)
    } catch {
      toast({ title: t('createFailed'), variant: 'destructive' })
    }
  }

  return (
    <FeaturePage
      title={t('title')}
      actions={<ListAddButton onClick={() => void handleCreate()}>{t('newConversation')}</ListAddButton>}
    >
      <ListPageBody>
        {listError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        ) : null}
        {items.length === 0 && listStatus !== 'loading' ? (
          <ItemListEmpty>{t('empty')}</ItemListEmpty>
        ) : (
          <ItemList>
            {items.map((conversation: Conversation) => (
              <ItemListItem key={conversation.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => navigate(`/conversations/${conversation.id}`)}
                  >
                    <p className="font-medium">{conversation.title || t('untitled')}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayDateTime(conversation.updatedAt)}
                    </p>
                  </button>
                </ItemListContent>
              </ItemListItem>
            ))}
          </ItemList>
        )}
        <ListPageFooter
          className="mt-auto"
          currentPage={page}
          pageSize={pageSize}
          totalCount={total}
          loadedCount={items.length}
          hasMore={items.length < total}
          loadingMore={listStatus === 'loading' && items.length > 0}
          onPageChange={(next) =>
            dispatch(conversationsActions.loadListRequested({ page: next, force: true }))
          }
          onPageSizeChange={(next) =>
            dispatch(conversationsActions.loadListRequested({ page: 1, pageSize: next, force: true }))
          }
          onLoadMore={() =>
            dispatch(conversationsActions.loadListRequested({ page: page + 1, append: true }))
          }
          onModeChange={() =>
            dispatch(conversationsActions.loadListRequested({ page: 1, pageSize, force: true }))
          }
        />
      </ListPageBody>
    </FeaturePage>
  )
}
