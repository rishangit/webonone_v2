import { useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  ImagePreview,
  isStatusTagVariant,
  ItemList,
  itemListThumbClassName,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  StatusTag,
  useToast,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { findMatchingSessionRole } from '@/features/auth/sessionRoleApi'
import type { MyCompanySummary } from '@/features/companies/services/companyApi'
import { MY_COMPANIES_PATH } from '@/features/companies/utils/companyPaths'
import { formatCompanyDate } from '@/features/companies/utils/formatCompanyDate'

type MyCompaniesListProps = {
  items: MyCompanySummary[]
  emptyMessage?: string
  listPath?: string
  onOpenProfile: (companyId: string) => void
}

function canLoginAsOwner(item: MyCompanySummary): boolean {
  return item.role === 'company_admin' && item.status !== 'rejected'
}

export function MyCompaniesList({
  items,
  emptyMessage = 'No companies yet.',
  listPath = MY_COMPANIES_PATH,
  onOpenProfile,
}: MyCompaniesListProps) {
  const { roleOptions, selectRole } = useSession()
  const { toast } = useToast()
  const [loggingInId, setLoggingInId] = useState<string | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  async function handleLogin(item: MyCompanySummary) {
    if (!canLoginAsOwner(item)) return
    const option = findMatchingSessionRole(roleOptions, 'company_admin', item.id)
    if (!option) {
      toast({
        title: 'Could not sign in',
        description: 'This company account is not available for your user.',
        variant: 'destructive',
      })
      return
    }

    setLoggingInId(item.id)
    try {
      await selectRole(option)
      toast({ title: `Signed in as ${item.name}` })
    } catch (err) {
      toast({
        title: 'Could not sign in',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setLoggingInId(null)
    }
  }

  return (
    <ItemList>
      {items.map((item) => {
        const createdLabel = formatCompanyDate(item.createdAt)
        const subtitle = createdLabel ? `Registered ${createdLabel}` : undefined
        const loginEnabled = canLoginAsOwner(item)
        const isOwnerList = listPath === MY_COMPANIES_PATH

        return (
          <ItemListItem key={item.id}>
            <Pressable className="min-w-0 flex-1 flex-row items-start gap-3" onPress={() => onOpenProfile(item.id)}>
              <ImagePreview src={item.logoUrl} alt={item.name} className={itemListThumbClassName} />
              <View className="min-w-0 flex-1 gap-1">
                <ItemListContent title={item.name} subtitle={subtitle} />
                <View className="flex-row flex-wrap gap-2">
                  <StatusTag variant={item.status} />
                  {isStatusTagVariant(item.role) ? <StatusTag variant={item.role} /> : null}
                </View>
              </View>
            </Pressable>
            <ItemListMenu ariaLabel={`Actions — ${item.name}`}>
              <ItemListMenuItem onPress={() => onOpenProfile(item.id)}>View details</ItemListMenuItem>
              {isOwnerList && item.role === 'company_admin' ? (
                <ItemListMenuItem
                  disabled={!loginEnabled || loggingInId === item.id}
                  onPress={() => void handleLogin(item)}
                >
                  {loggingInId === item.id
                    ? 'Signing in…'
                    : item.status === 'rejected'
                      ? 'Login unavailable'
                      : 'Login'}
                </ItemListMenuItem>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
