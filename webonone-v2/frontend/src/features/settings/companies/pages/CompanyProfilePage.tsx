import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  cn,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import type { CompanyWizardStep } from '@/features/settings/basic/schemas/companySchemas'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import { CompanyContactCard } from '../components/CompanyContactCard'
import { CompanyDataEntitiesCard } from '../components/CompanyDataEntitiesCard'
import { CompanyFormDialog } from '../components/CompanyFormDialog'
import { CompanyGalleryCard } from '../components/CompanyGalleryCard'
import { CompanyLocationCard } from '../components/CompanyLocationCard'
import { CompanyLogoCard } from '../components/CompanyLogoCard'
import { CompanyProfileCard } from '../components/CompanyProfileCard'
import { CompanyTagsCard } from '../components/CompanyTagsCard'

type CompanyProfilePageProps = {
  backTo: string
  backLabel: string
}

type CompanyProfileTab = 'profile' | 'gallery' | 'data'

const COMPANY_PROFILE_TABS = [
  'profile',
  'gallery',
  'data',
] as const satisfies readonly CompanyProfileTab[]

const TABS: { id: CompanyProfileTab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'data', label: 'Data' },
]

export function CompanyProfilePage({ backTo, backLabel }: CompanyProfilePageProps) {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const detail = useAppSelector((s) => s.companies.detail)
  const detailStatus = useAppSelector((s) => s.companies.detailStatus)
  const detailError = useAppSelector((s) => s.companies.detailError)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)

  const [tab, setTab] = useDetailTabParam(COMPANY_PROFILE_TABS, 'profile')
  const [dialog, setDialog] = useState<{ initialStep: CompanyWizardStep } | null>(null)

  const loading = detailStatus === 'loading' && !detail
  const saving = detailStatus === 'saving'

  usePlatformLoading(loading ? 'Loading company…' : null)

  useEffect(() => {
    if (!companyId) return
    dispatch(companiesActions.loadCompanyDetailRequested({ id: companyId }))
    return () => {
      dispatch(companiesActions.clearCompanyDetail())
    }
  }, [companyId, dispatch])

  const canEdit =
    Boolean(detail) &&
    (detail?.role === 'company_admin' || activeRole === 'super_admin')

  function openWizard(initialStep: CompanyWizardStep) {
    setDialog({ initialStep })
  }

  if (loading) {
    return null
  }

  if (detailError && !detail) {
    return (
      <FeaturePage
        title="Company profile"
        description="Company details, gallery images, and Data services."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!detail || !companyId) {
    return null
  }

  return (
    <FeaturePage
      title={detail.name}
      description="Company details, gallery images, and Data services."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {detailError ? (
          <Alert variant="destructive">
            <AlertDescription>{detailError}</AlertDescription>
          </Alert>
        ) : null}

        <div
          role="tablist"
          aria-label="Company profile sections"
          className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`company-profile-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`company-profile-panel-${item.id}`}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors',
                tab === item.id && 'bg-background text-foreground shadow-sm',
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`company-profile-panel-${tab}`}
          aria-labelledby={`company-profile-tab-${tab}`}
        >
          {tab === 'profile' ? (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-6 lg:col-span-2">
                <CompanyProfileCard
                  detail={detail}
                  canEdit={canEdit}
                  onEdit={() => openWizard(1)}
                />
                <CompanyLocationCard
                  detail={detail}
                  canEdit={canEdit}
                  onEdit={() => openWizard(3)}
                />
              </div>
              <div className="flex flex-col gap-6 lg:col-span-1">
                <CompanyContactCard
                  detail={detail}
                  canEdit={canEdit}
                  onEdit={() => openWizard(2)}
                />
                <CompanyTagsCard
                  tags={detail.tags ?? []}
                  canEdit={canEdit}
                  onEdit={() => openWizard(4)}
                />
              </div>
            </div>
          ) : tab === 'gallery' ? (
            <div className="flex flex-col gap-6">
              <CompanyLogoCard
                companyId={companyId}
                logoUrl={detail.logoUrl}
                canEdit={canEdit}
                saving={saving}
              />
              <CompanyGalleryCard
                companyId={companyId}
                galleryImages={detail.galleryImages ?? []}
                canEdit={canEdit}
                saving={saving}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <CompanyDataEntitiesCard
                companyId={companyId}
                dataEntities={detail.dataEntities ?? []}
                canEdit={canEdit}
                saving={saving}
              />
            </div>
          )}
        </div>
      </div>

      {dialog && companyId ? (
        <CompanyFormDialog
          open
          id={companyId}
          initialStep={dialog.initialStep}
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
          onSaved={() => {
            dispatch(companiesActions.loadCompanyDetailRequested({ id: companyId }))
            setDialog(null)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}

export function MemberCompanyProfilePage() {
  return (
    <CompanyProfilePage backTo="/settings/companies" backLabel="Back to All Companies" />
  )
}

export function AdminCompanyProfilePage() {
  return <CompanyProfilePage backTo="/companies" backLabel="Back to Companies" />
}
