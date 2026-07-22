import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuItem,
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

type MyCompaniesListProps = {
  items: MyCompanySummary[]
}

function canLoginAsOwner(item: MyCompanySummary): boolean {
  return item.role === 'company_admin' && item.status !== 'rejected'
}

export function MyCompaniesList({ items }: MyCompaniesListProps) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [loggingInId, setLoggingInId] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const rows = Array.isArray(items) ? items : []

  if (rows.length === 0) {
    return <ItemListEmpty>No companies yet. Add a company to get started.</ItemListEmpty>
  }

  function openProfile(id: string) {
    navigate(`/settings/companies/${id}`)
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
      setLoginError(err instanceof Error ? err.message : 'Failed to log in to company')
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
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs">
                        No logo
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{item.name}</p>
                        <StatusTag variant={item.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.role === 'company_admin' ? 'Company Owner' : 'Member'}
                        {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString()}` : null}
                      </p>
                    </div>
                  </div>
                </button>
              </ItemListContent>
              {item.role === 'company_admin' ? (
                <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
                  <DropdownMenuItem onClick={() => openProfile(item.id)}>
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!loginEnabled || loggingInId === item.id}
                    title={
                      item.status === 'rejected'
                        ? 'Login is unavailable for rejected companies'
                        : undefined
                    }
                    onClick={() => void handleLogin(item)}
                  >
                    {loggingInId === item.id
                      ? 'Logging in…'
                      : item.status === 'rejected'
                        ? 'Login (rejected)'
                        : 'Login'}
                  </DropdownMenuItem>
                </ItemListMenu>
              ) : (
                <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
                  <DropdownMenuItem onClick={() => openProfile(item.id)}>
                    View details
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
