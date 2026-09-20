import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { StaffFormDialog } from '@/features/staff/components/StaffFormDialog'
import { StaffHistoryPanel } from '@/features/staff/components/StaffHistoryPanel'
import { StaffLeavesPanel } from '@/features/staff/components/StaffLeavesPanel'
import { StaffOverviewView } from '@/features/staff/components/StaffOverviewView'
import { staffApi } from '@/features/staff/services/staffApi'
import type { CompanyStaff } from '@/features/staff/types/staff.types'
import type { StaffWizardStep } from '@/features/staff/schemas/staffSchemas'
import { STAFF_LIST_PATH } from '@/features/staff/utils/staffPaths'
import { canAccessCompanySession } from '@/features/sales/utils/canAccessCompanySession'

type StaffDetailTab = 'overview' | 'history' | 'leaves'

type StaffDetailScreenProps = {
  staffId: string
  initialTab?: StaffDetailTab
}

export function StaffDetailScreen({ staffId, initialTab = 'overview' }: StaffDetailScreenProps) {
  const { t } = useTranslation('staff')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { user } = useSession()
  const canAccess = canAccessCompanySession(user?.role, user?.companyId)
  const canEdit = user?.role === 'company_admin' && Boolean(user?.companyId)

  const [tab, setTab] = useState<StaffDetailTab>(initialTab)
  const [detail, setDetail] = useState<CompanyStaff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ initialStep: StaffWizardStep } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDetail(await staffApi.get(staffId))
    } catch (err) {
      setDetail(null)
      setError(err instanceof Error ? err.message : t('wizard.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [staffId, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const existingUserIds = useMemo(() => {
    if (!detail) return new Set<string>()
    return new Set([detail.userId])
  }, [detail])

  if (user && !canAccess) {
    return <Redirect href="/" />
  }

  const title = detail?.displayName ?? t('detail.title')

  return (
    <FeatureScreen
      title={title}
      description={t('detail.pageDescription')}
      onBack={() => router.push(STAFF_LIST_PATH as Href)}
      backLabel={tc('back')}
    >
      {loading ? <Spinner label={t('detail.loading')} /> : null}
      {!loading && error && !detail ? <Body className="text-destructive">{error}</Body> : null}

      {detail ? (
        <Tabs value={tab} onValueChange={(value) => setTab(value as StaffDetailTab)}>
          <TabsList aria-label={t('detail.ariaSections')}>
            <TabsTrigger value="overview">{t('detail.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="history">{t('detail.tabs.history')}</TabsTrigger>
            <TabsTrigger value="leaves">{t('detail.tabs.leaves')}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <StaffOverviewView
              staff={detail}
              canEdit={canEdit}
              onEditStep={(step) => setDialog({ initialStep: step })}
            />
          </TabsContent>
          <TabsContent value="history">
            <StaffHistoryPanel staffId={staffId} userId={detail.userId} />
          </TabsContent>
          <TabsContent value="leaves">
            <StaffLeavesPanel staff={detail} canManage={canEdit} />
          </TabsContent>
        </Tabs>
      ) : null}

      {dialog && detail ? (
        <StaffFormDialog
          open
          id={staffId}
          initialStep={dialog.initialStep}
          existingUserIds={existingUserIds}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={(saved) => {
            setDetail(saved)
            setDialog(null)
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
