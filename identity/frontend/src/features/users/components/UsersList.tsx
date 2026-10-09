import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  ContactValueLine,
  DropdownMenuItem,
  ImagePreview,
  ItemListCollectionCard,
  itemListCardImageClassName,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListRowBodyClassName,
  itemListThumbClassName,
  StatusTag,
  isStatusTagVariant,
} from '@webonone/ui-kit'
import type { UserPickerUser } from '@/features/users/types'

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

type UsersListProps = {
  items: UserPickerUser[]
  emptyLabel: string | null
  isSuperAdmin: boolean
  companyCustomersMode: boolean
  currentUserId: string | undefined
  impersonatingUserId: string | null
  onOpen: (id: string) => void
  onImpersonate: (user: UserPickerUser) => void
}

export function UsersList({
  items,
  emptyLabel,
  isSuperAdmin,
  companyCustomersMode,
  currentUserId,
  impersonatingUserId,
  onOpen,
  onImpersonate,
}: UsersListProps) {
  const { t } = useTranslation('users')
  const { t: tc } = useTranslation('common')

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: UserPickerUser, b: UserPickerUser) =>
          a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
        cell: (user: UserPickerUser) => user.displayName,
      },
    ],
    [tc],
  )

  function renderRowMenu(user: UserPickerUser) {
    if (!isSuperAdmin || companyCustomersMode || user.id === currentUserId) return null
    return (
      <ItemListMenu ariaLabel={t('actionsFor', { name: user.displayName })}>
        <DropdownMenuItem
          disabled={impersonatingUserId === user.id}
          onClick={() => onImpersonate(user)}
        >
          {t('actions.impersonate')}
        </DropdownMenuItem>
      </ItemListMenu>
    )
  }

  function userDetails(user: UserPickerUser) {
    return (
      <>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.displayName}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <ContactValueLine kind="email" value={user.email} emptyLabel={t('noEmail')} />
            {user.email?.trim() ? (
              <StatusTag
                className="shrink-0"
                variant={user.isEmailVerified ? 'verified' : 'unverified'}
              />
            ) : null}
          </div>
          {user.phoneNumber?.trim() ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <ContactValueLine kind="phone" value={user.phoneNumber} />
              <StatusTag
                className="shrink-0"
                variant={user.isPhoneVerified ? 'verified' : 'unverified'}
              />
            </div>
          ) : null}
        </div>
        {user.role ? (
          isStatusTagVariant(user.role) ? (
            <StatusTag className="shrink-0 self-center" variant={user.role} />
          ) : (
            <StatusTag className="shrink-0 self-center" variant="member">
              {formatRoleLabel(user.role)}
            </StatusTag>
          )
        ) : null}
      </>
    )
  }

  function rowBody(user: UserPickerUser) {
    return (
      <button
        type="button"
        className={`${itemListRowBodyClassName} rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        onClick={() => onOpen(user.id)}
      >
        <ImagePreview
          src={user.avatarUrl}
          alt={user.displayName}
          mode="view"
          className={itemListThumbClassName}
        />
        {userDetails(user)}
      </button>
    )
  }

  if (emptyLabel) {
    return <ItemListEmpty>{emptyLabel}</ItemListEmpty>
  }

  return (
    <CollectionListView
      items={items}
      getRowKey={(user) => user.id}
      columns={columns}
      empty={<ItemListEmpty>{t('empty.noneFound')}</ItemListEmpty>}
      renderGridActions={renderRowMenu}
      renderListItem={(user) => (
        <ItemListItem>
          <ItemListContent>{rowBody(user)}</ItemListContent>
          {renderRowMenu(user)}
        </ItemListItem>
      )}
      renderCard={(user) => (
        <ItemListCollectionCard
          image={
            <ImagePreview
              src={user.avatarUrl}
              alt={user.displayName}
              mode="view"
              className={itemListCardImageClassName}
            />
          }
          menu={renderRowMenu(user)}
          onBodyClick={() => onOpen(user.id)}
        >
          <div className={itemListRowBodyClassName}>{userDetails(user)}</div>
        </ItemListCollectionCard>
      )}
    />
  )
}
