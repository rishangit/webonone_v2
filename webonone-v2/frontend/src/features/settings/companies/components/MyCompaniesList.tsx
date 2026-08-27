import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  ImagePreview,
  isStatusTagVariant,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { sessionRoleActions } from '@/features/session/store/sessionRoleSlice'
import { sessionRoleApi } from '@/features/session/services/sessionRoleApi'
import type { MyCompanySummary } from '@/features/settings/basic/services/companyApi'
import { formatLocaleDateTime } from '@/shared/utils/formatLocaleDate'
import { MY_COMPANIES_PATH, companySettingsProfilePath } from '../utils/companySettingsPaths'

type MyCompaniesListProps = {
  items: MyCompanySummary[]
  emptyMessage?: string
  /** List page that opened this row — keeps sidebar/breadcrumb on that nav item. */
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
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [loggingInId, setLoggingInId] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const rows = Array.isArray(items) ? items : []
  const empty = emptyMessage ?? t('myCompanies.empty')

  if (rows.length === 0) {
    return <ItemListEmpty>{empty}</ItemListEmpty>
  }

  function openProfile(id: string) {
    navigate(companySettingsProfilePath(listPath, id))
  }

  async function handleLogin(item: MyCompanySummary) {
    if (!accessToken || !canLoginAsOwner(item)) return
    setLoginError(null)
    setLoggingInId(item.id)
    try {
      const result = await sessionRoleApi.reissueSessionRole(
        accessToken,
        'company_admin',
        item.id,
      )
      dispatch(authActions.tokenRefreshed({ accessToken: result.accessToken, user: result.user }))
      dispatch(
        sessionRoleActions.roleSelected({
          role: 'company_admin',
          companyId: item.id,
        }),
      )
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : t('myCompanies.failedLogin'))
    } finally {
      setLoggingInId(null)
    }
  }

  return (
    <div className="space-y-2">
      {loginError ? <p className="text-sm text-destructive">{loginError}</p> : null}
      <ItemList>
        {rows.map((item) => {
          const loginEnabled = canLoginAsOwner(item)
          return (
            <ItemListItem key={item.id}>
              <ItemListContent>
                <button
                  type="button"
                  className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openProfile(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <ImagePreview
                      src={item.logoUrl}
                      alt={item.name}
                      mode="view"
                      className="h-10 w-10 rounded-md"
                    />
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
                  </div>
                </button>
              </ItemListContent>
              {item.role === 'company_admin' ? (
                <ItemListMenu ariaLabel={`${t('common:actions')} — ${item.name}`}>
                  <DropdownMenuItem onClick={() => openProfile(item.id)}>
                    {t('myCompanies.viewDetails')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!loginEnabled || loggingInId === item.id}
                    title={
                      item.status === 'rejected' ? t('myCompanies.loginUnavailableRejected') : undefined
                    }
                    onClick={() => void handleLogin(item)}
                  >
                    {loggingInId === item.id
                      ? t('myCompanies.loggingIn')
                      : item.status === 'rejected'
                        ? t('myCompanies.loginRejected')
                        : t('myCompanies.login')}
                  </DropdownMenuItem>
                </ItemListMenu>
              ) : (
                <ItemListMenu ariaLabel={`${t('common:actions')} — ${item.name}`}>
                  <DropdownMenuItem onClick={() => openProfile(item.id)}>
                    {t('myCompanies.viewDetails')}
                  </DropdownMenuItem>
                </ItemListMenu>
              )}
            </ItemListItem>
          )
        })}
      </ItemList>
    </div>
  )
}
