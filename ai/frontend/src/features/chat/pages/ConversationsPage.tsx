import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
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
import { aiApi } from '@/shared/services/aiApi'
import type { Conversation } from '@/shared/types/ai.types'

export function ConversationsPage() {
  const { t } = useTranslation('chat')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { items, total, page, pageSize, listStatus, listError } = useAppSelector((s) => s.conversations)
  const loading = listStatus === 'loading' && items.length === 0
  usePlatformLoading(loading ? t('loading') : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(conversationsActions.loadListRequested({ page: 1, pageSize: 12, force: true }))
  }, [accessToken, dispatch])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  async function handleCreate() {
    try {
      const settings = await aiApi.getAiSettings()
      if (!settings.configured) {
        toast({
          title: t('setupRequired'),
          description: t('setupDescription'),
          variant: 'destructive',
        })
        return
      }
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
                      {new Date(conversation.updatedAt).toLocaleString()}
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
