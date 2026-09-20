import { useCallback, useEffect, useState } from 'react'
import { Redirect, useRouter, type Href } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Body,
  FeatureScreen,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { UserHistoryPanel } from '@/features/users/components/UserHistoryPanel'
import { UserOverviewView } from '@/features/users/components/UserOverviewView'
import { getUser } from '@/features/users/services/usersApi'
import type { IdentityUserDetail } from '@/features/users/types/users.types'
import {
  canAccessCompanyCustomers,
  canQueryUsers,
} from '@/features/users/utils/access'
import { USERS_LIST_PATH } from '@/features/users/utils/userPaths'

type UserDetailScreenProps = {
  userId: string
  initialTab?: 'overview' | 'history'
}

export function UserDetailScreen({ userId, initialTab = 'overview' }: UserDetailScreenProps) {
  const { t } = useTranslation('users')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { user: sessionUser } = useSession()
  const companyCustomersMode = canAccessCompanyCustomers(sessionUser)
  const [tab, setTab] = useState<'overview' | 'history'>(initialTab)
  const [detail, setDetail] = useState<IdentityUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDetail(await getUser(userId))
    } catch (err) {
      setDetail(null)
      setError(err instanceof Error ? err.message : t('errors.loadUserFailed'))
    } finally {
      setLoading(false)
    }
  }, [userId, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  if (sessionUser && !canQueryUsers(sessionUser)) {
    return <Redirect href="/profile" />
  }

  const title = detail?.displayName ?? t('userFallbackTitle')

  return (
    <FeatureScreen
      title={title}
      description={t('userDetailsDescription')}
      onBack={() => router.push(USERS_LIST_PATH as Href)}
      backLabel={tc('back')}
    >
      {loading ? <Spinner label={t('loading.user')} /> : null}
      {!loading && error && !detail ? <Body className="text-destructive">{error}</Body> : null}

      {detail ? (
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'overview' | 'history')}>
          <TabsList aria-label={t('sectionsAria')}>
            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <UserOverviewView user={detail} />
          </TabsContent>
          <TabsContent value="history">
            <UserHistoryPanel user={detail} companyCustomersMode={companyCustomersMode} />
          </TabsContent>
        </Tabs>
      ) : null}
    </FeatureScreen>
  )
}
