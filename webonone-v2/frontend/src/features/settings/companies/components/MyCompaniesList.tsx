import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  DropdownMenuItem,
  ImagePreview,
  isStatusTagVariant,
  ItemListCollectionCard,
  itemListCardImageClassName,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListThumbClassName,
  StatusTag,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { WebononeCopyToAiMenuItem } from '@/features/ai/components/WebononeCopyToAiMenuItem'
import { authActions } from '@/features/auth/store/authSlice'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import { sessionRoleApi } from '@/features/session/services/sessionRoleApi'
import type { MyCompanySummary } from '@/features/settings/basic/services/companyApi'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'
import { MY_COMPANIES_PATH, companySettingsProfilePath } from '../utils/companySettingsPaths'

type MyCompaniesListProps = {
  items: MyCompanySummary[]
  emptyMessage?: string
  listPath?: string
}

function canLoginAsOwner(item: MyCompanySummary): boolean {
  return item.role === 'company_admin' && item.status !== 'rejected'
}

export function MyCompaniesList({
  items,
  emptyMessage,
  listPath = MY_COMPANIES_PATH,
}: MyCompaniesListProps) {
  const { t, i18n } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const userId = useAppSelector((s) => s.auth.user?.id)
  const [loggingInId, setLoggingInId] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const rows = Array.isArray(items) ? items : []
  const empty = emptyMessage ?? t('myCompanies.empty')

  function openProfile(id: string) {
    navigate(companySettingsProfilePath(listPath, id))
  }

  async function handleLogin(item: MyCompanySummary) {
    if (!accessToken || !canLoginAsOwner(item)) return
    setLoginError(null)
    setLoggingInId(item.id)
    try {
      const result = await sessionRoleApi.reissueSessionRole(accessToken, 'company_admin', item.id)
      dispatch(
        sessionRoleActions.roleSelected({
          role: 'company_admin',
          companyId: item.id,
          userId,
        }),
      )
      dispatch(authActions.tokenRefreshed({ accessToken: result.accessToken, user: result.user }))
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : t('myCompanies.failedLogin'))
    } finally {
      setLoggingInId(null)
    }
  }

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: MyCompanySummary, b: MyCompanySummary) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (item: MyCompanySummary) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openProfile(item.id)}
          >
            {item.name}
          </button>
        ),
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (item: MyCompanySummary) => <StatusTag variant={item.status} />,
      },
      {
        id: 'role',
        header: t('myCompanies.columnRole'),
        cell: (item: MyCompanySummary) =>
          isStatusTagVariant(item.role) ? (
            <StatusTag variant={item.role} className="shrink-0" />
          ) : (
            <span className="text-xs text-muted-foreground">{item.role}</span>
          ),
      },
    ],
    [t, tc],
  )

  function renderRowMenu(item: MyCompanySummary) {
    const loginEnabled = canLoginAsOwner(item)
    const baseItems = (
      <>
        <DropdownMenuItem onClick={() => openProfile(item.id)}>
          {t('myCompanies.viewDetails')}
        </DropdownMenuItem>
        <WebononeCopyToAiMenuItem kind="company" id={item.id} label={item.name} />
      </>
    )
    if (item.role !== 'company_admin') {
      return (
        <ItemListMenu ariaLabel={`${tc('actions')} — ${item.name}`}>{baseItems}</ItemListMenu>
      )
    }
    return (
      <ItemListMenu ariaLabel={`${tc('actions')} — ${item.name}`}>
        {baseItems}
        <DropdownMenuItem
          disabled={!loginEnabled || loggingInId === item.id}
          title={item.status === 'rejected' ? t('myCompanies.loginUnavailableRejected') : undefined}
          onClick={() => void handleLogin(item)}
        >
          {loggingInId === item.id
            ? t('myCompanies.loggingIn')
            : item.status === 'rejected'
              ? t('myCompanies.loginRejected')
              : t('myCompanies.login')}
        </DropdownMenuItem>
      </ItemListMenu>
    )
  }

  function myCompanyDetails(item: MyCompanySummary) {
    return (
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{item.name}</p>
          <StatusTag variant={item.status} />
          {isStatusTagVariant(item.role) ? (
            <StatusTag variant={item.role} className="shrink-0" />
          ) : (
            <span className="text-xs text-muted-foreground">{item.role}</span>
          )}
        </div>
        {item.createdAt ? (
          <p className="text-xs text-muted-foreground">
            {formatLocaleDateTime(item.createdAt, i18n.language)}
          </p>
        ) : null}
      </div>
    )
  }

  function rowBody(item: MyCompanySummary) {
    return (
      <div className="flex items-start gap-3">
        <ImagePreview
          src={item.logoUrl}
          alt={item.name}
          mode="view"
          className={itemListThumbClassName}
        />
        {myCompanyDetails(item)}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {loginError ? <p className="text-sm text-destructive">{loginError}</p> : null}
      <CollectionListView
        items={rows}
        getRowKey={(item) => item.id}
        columns={columns}
        empty={<ItemListEmpty>{empty}</ItemListEmpty>}
        renderGridActions={renderRowMenu}
        renderListItem={(item) => (
          <ItemListItem>
            <ItemListContent>
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openProfile(item.id)}
              >
                {rowBody(item)}
              </button>
            </ItemListContent>
            {renderRowMenu(item)}
          </ItemListItem>
        )}
        renderCard={(item) => (
          <ItemListCollectionCard
            image={
              <ImagePreview
                src={item.logoUrl}
                alt={item.name}
                mode="view"
                className={itemListCardImageClassName}
              />
            }
            menu={renderRowMenu(item)}
            onBodyClick={() => openProfile(item.id)}
          >
            {myCompanyDetails(item)}
          </ItemListCollectionCard>
        )}
      />
    </div>
  )
}
