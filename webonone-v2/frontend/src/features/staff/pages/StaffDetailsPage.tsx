import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { canAccessCompanySession } from '@/features/session/utils/canAccessCompanySession'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { StaffFormDialog } from '@/features/staff/components/StaffFormDialog'
import { StaffHistoryPanel } from '@/features/staff/components/StaffHistoryPanel'
import { StaffScheduleCard } from '@/features/staff/components/StaffScheduleCard'
import { StaffUserCard } from '@/features/staff/components/StaffUserCard'
import type { StaffWizardStep } from '@/features/staff/schemas/staffSchemas'
import { staffActions } from '@/features/staff/store'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type StaffDetailTab = 'overview' | 'history'

export function StaffDetailsPage() {
  const { staffId } = useParams<{ staffId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const detail = useAppSelector((s) => s.staff.detail) as CompanyStaff | null
  const detailStatus = useAppSelector((s) => s.staff.detailStatus)
  const detailError = useAppSelector((s) => s.staff.detailError)
  const listItems = useAppSelector((s) => s.staff.items) as CompanyStaff[]

  const [dialog, setDialog] = useState<{ initialStep: StaffWizardStep } | null>(null)

  const tab: StaffDetailTab = searchParams.get('tab') === 'history' ? 'history' : 'overview'

  const loading = detailStatus === 'loading' && !detail
  usePlatformLoading(loading ? 'Loading staff…' : null)

  useEffect(() => {
    if (!staffId) return
    dispatch(staffActions.fetchDetailRequested({ id: staffId, force: true }))
    return () => {
      dispatch(staffActions.resetDetail())
    }
  }, [dispatch, staffId])

  const canEdit = selectionComplete && activeRole === 'company_admin'
  const existingUserIds = new Set(
    listItems.filter((item) => item.id !== staffId).map((item) => item.userId),
  )

  function openWizard(initialStep: StaffWizardStep) {
    setDialog({ initialStep })
  }

  function setTab(next: StaffDetailTab) {
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        if (next === 'overview') {
          nextParams.delete('tab')
        } else {
          nextParams.set('tab', next)
        }
        return nextParams
      },
      { replace: false },
    )
  }

  if (selectionComplete && !canAccessCompanySession(activeRole, activeCompanyId)) {
    return (
      <FeaturePage title="Staff" description="Staff details">
        <Alert variant="destructive">
          <AlertDescription>Company session required.</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (loading) {
    return null
  }

  if (detailError && !detail) {
    return (
      <FeaturePage
        title="Staff"
        description="Staff details"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/staff')}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!detail || !staffId) {
    return null
  }

  const tabs: { id: StaffDetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'History' },
  ]

  const overview = (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <StaffScheduleCard
          staff={detail}
          canEdit={canEdit}
          onEdit={() => openWizard(2)}
        />
      </div>
      <div className="flex flex-col gap-6 lg:col-span-1">
        <StaffUserCard
          staff={detail}
          canEdit={canEdit}
          canViewProfile={canEdit}
          onEdit={() => openWizard(1)}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Record</CardTitle>
            <CardDescription>Staff record metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Added</p>
              <p className="text-sm text-foreground">
                {new Date(detail.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Updated</p>
              <p className="text-sm text-foreground">
                {new Date(detail.updatedAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <FeaturePage
      title={detail.displayName}
      description="Staff member details and weekly work schedule."
      actions={
        <Button type="button" variant="outline" size="sm" onClick={() => navigate('/staff')}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
      }
    >
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as StaffDetailTab)}
        className="flex flex-col gap-6"
      >
        <TabsList aria-label="Staff sections">
          {tabs.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-0 outline-none">
          {tab === 'overview' ? overview : <StaffHistoryPanel userId={detail.userId} />}
        </TabsContent>
      </Tabs>

      {dialog ? (
        <StaffFormDialog
          open
          id={staffId}
          initialStep={dialog.initialStep}
          existingUserIds={existingUserIds}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={() => {
            dispatch(staffActions.fetchDetailRequested({ id: staffId, force: true }))
            setDialog(null)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}
