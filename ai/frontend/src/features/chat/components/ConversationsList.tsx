import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  ItemListCardPlaceholderImage,
  ItemListCollectionCard,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  dateSortColumn,
} from '@webonone/ui-kit'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'
import type { Conversation } from '@/shared/types/ai.types'

interface ConversationsListProps {
  items: Conversation[]
  onOpen: (id: string) => void
}

export function ConversationsList({ items, onOpen }: ConversationsListProps) {
  const { t, i18n } = useTranslation('chat')

  const columns = useMemo(
    () => [
      {
        id: 'title',
        header: 'Title',
        sortable: true,
        compare: (a: Conversation, b: Conversation) =>
          (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }),
        cell: (conversation: Conversation) => conversation.title || t('untitled'),
      },
      dateSortColumn<Conversation>(
        'updated',
        'Updated',
        (item) => item.updatedAt,
        (iso) => formatDisplayDateTime(iso, i18n.language),
      ),
    ],
    [i18n.language, t],
  )

  function rowBody(conversation: Conversation) {
    return (
      <>
        <p className="font-medium">{conversation.title || t('untitled')}</p>
        <p className="text-sm text-muted-foreground">
          {formatDisplayDateTime(conversation.updatedAt, i18n.language)}
        </p>
      </>
    )
  }

  return (
    <CollectionListView
      items={items}
      getRowKey={(conversation) => conversation.id}
      columns={columns}
      empty={<ItemListEmpty>{t('empty')}</ItemListEmpty>}
      renderListItem={(conversation) => (
        <ItemListItem>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onOpen(conversation.id)}
            >
              {rowBody(conversation)}
            </button>
          </ItemListContent>
        </ItemListItem>
      )}
      renderCard={(conversation) => (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage />}
          onBodyClick={() => onOpen(conversation.id)}
        >
          {rowBody(conversation)}
        </ItemListCollectionCard>
      )}
    />
  )
}
