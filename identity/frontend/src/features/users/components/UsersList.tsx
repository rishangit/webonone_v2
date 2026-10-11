import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  cn,
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

  const gridThumbClassName = 'h-10 w-10 shrink-0 rounded-md'
  const contactValueWrapClassName = '[&_span]:whitespace-normal [&_span]:break-all'

  const columns = useMemo(
    () => [
      {
        id: 'avatar',
        header: '',
        className: 'w-14',
        cell: (user: UserPickerUser) => (
          <ImagePreview
            src={user.avatarUrl}
            alt={user.displayName}
            mode="view"
            className={gridThumbClassName}
          />
        ),
      },
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: UserPickerUser, b: UserPickerUser) =>
          a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
        cell: (user: UserPickerUser) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onOpen(user.id)}
          >
            {user.displayName}
          </button>
        ),
      },
      {
        id: 'email',
        header: tc('email'),
        sortable: true,
        compare: (a: UserPickerUser, b: UserPickerUser) =>
          (a.email ?? '').localeCompare(b.email ?? '', undefined, { sensitivity: 'base' }),
        cell: (user: UserPickerUser) => (
          <ContactValueLine
            kind="email"
            value={user.email}
            emptyLabel={t('noEmail')}
            verified={user.email?.trim() ? user.isEmailVerified : undefined}
            className={contactValueWrapClassName}
          />
        ),
      },
      {
        id: 'phone',
        header: t('form.phoneNumber'),
        cell: (user: UserPickerUser) =>
          user.phoneNumber?.trim() ? (
            <ContactValueLine
              kind="phone"
              value={user.phoneNumber}
              verified={user.isPhoneVerified}
              className={contactValueWrapClassName}
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'role',
        header: t('roles.label'),
        sortable: true,
        compare: (a: UserPickerUser, b: UserPickerUser) =>
          (a.role ?? '').localeCompare(b.role ?? '', undefined, { sensitivity: 'base' }),
        cell: (user: UserPickerUser) => renderRoleTag(user) ?? <span className="text-muted-foreground">—</span>,
      },
    ],
    [onOpen, t, tc],
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

  function renderRoleTag(user: UserPickerUser) {
    if (!user.role) return null
    if (isStatusTagVariant(user.role)) {
      return <StatusTag variant={user.role} />
    }
    return <StatusTag variant="member">{formatRoleLabel(user.role)}</StatusTag>
  }

  function userDetails(user: UserPickerUser, layout: 'list' | 'card') {
    const contactClassName = layout === 'card' ? contactValueWrapClassName : undefined

    const emailLine = (
      <ContactValueLine
        kind="email"
        value={user.email}
        emptyLabel={t('noEmail')}
        verified={user.email?.trim() ? user.isEmailVerified : undefined}
        className={cn('mt-0.5', contactClassName)}
      />
    )

    const phoneLine = user.phoneNumber?.trim() ? (
      <ContactValueLine
        kind="phone"
        value={user.phoneNumber}
        verified={user.isPhoneVerified}
        className={cn('mt-0.5', contactClassName)}
      />
    ) : null

    const roleTag = renderRoleTag(user)

    if (layout === 'card') {
      return (
        <div className="flex w-full min-w-0 flex-col gap-0.5">
          <p className="break-words font-medium leading-snug">{user.displayName}</p>
          {emailLine}
          {phoneLine}
          {roleTag ? <div className="mt-1.5">{roleTag}</div> : null}
        </div>
      )
    }

    return (
      <>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.displayName}</p>
          {emailLine}
          {phoneLine}
        </div>
        {roleTag ? <div className="shrink-0 self-center">{roleTag}</div> : null}
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
        {userDetails(user, 'list')}
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
          <div className="w-full min-w-0">{userDetails(user, 'card')}</div>
        </ItemListCollectionCard>
      )}
    />
  )
}
