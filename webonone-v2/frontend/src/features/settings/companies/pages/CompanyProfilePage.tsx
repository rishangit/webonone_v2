import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  cn,
} from '@webonone/ui-kit'
import { filterCompanyDataEntities, type CompanyDataEntityKey } from '@webonone/platform-nav'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import type { CompanyWizardStep } from '@/features/settings/basic/schemas/companySchemas'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import { MemberCompanyCatalogPanel } from '../components/MemberCompanyCatalogPanel'
import { CompanyAddressCard } from '../components/CompanyAddressCard'
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
  /** Admin = Overview/Gallery/Data; member = Overview + catalog entity tabs when data exists. */
  variant?: 'admin' | 'member'
}

type AdminProfileTab = 'overview' | 'gallery' | 'data'
type MemberCatalogTab = CompanyDataEntityKey
type MemberProfileTab = 'overview' | MemberCatalogTab

const ADMIN_TABS = [
  'overview',
  'gallery',
  'data',
] as const satisfies readonly AdminProfileTab[]

const ADMIN_TAB_ITEMS: { id: AdminProfileTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'data', label: 'Data' },
]

const MEMBER_CATALOG_TAB_LABELS: Record<MemberCatalogTab, string> = {
  services: 'Our Services',
  products: 'Our Products',
  spaces: 'Our Spaces',
}

const ALL_MEMBER_TABS = [
  'overview',
  'services',
  'products',
  'spaces',
] as const satisfies readonly MemberProfileTab[]

export function CompanyProfilePage({
  backTo,
  backLabel,
  variant = 'admin',
}: CompanyProfilePageProps) {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const detail = useAppSelector((s) => s.companies.detail)
  const detailStatus = useAppSelector((s) => s.companies.detailStatus)
  const detailError = useAppSelector((s) => s.companies.detailError)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)

  const [adminTab, setAdminTab] = useDetailTabParam(ADMIN_TABS, 'overview')
  const [memberTab, setMemberTab] = useDetailTabParam(ALL_MEMBER_TABS, 'overview')
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

  const memberCatalogTabs = useMemo(() => {
    if (!detail) return [] as MemberCatalogTab[]
    const enabled = filterCompanyDataEntities(detail.dataEntities ?? [])
    const counts = detail.catalogCounts ?? { products: 0, services: 0, spaces: 0 }
    return enabled.filter((key) => (counts[key] ?? 0) > 0)
  }, [detail])

  const memberTabItems = useMemo(() => {
    const items: { id: MemberProfileTab; label: string }[] = [
      { id: 'overview', label: 'Overview' },
    ]
    for (const key of memberCatalogTabs) {
      items.push({ id: key, label: MEMBER_CATALOG_TAB_LABELS[key] })
    }
    return items
  }, [memberCatalogTabs])

  const activeMemberTab: MemberProfileTab =
    memberTab !== 'overview' && !memberCatalogTabs.includes(memberTab) ? 'overview' : memberTab

  function openWizard(initialStep: CompanyWizardStep) {
    setDialog({ initialStep })
  }

  if (loading) {
    return null
  }

  const pageDescription =
    variant === 'member'
      ? 'Company details and catalog for companies you belong to.'
      : 'Company details, gallery images, and Data services.'

  if (detailError && !detail) {
    return (
      <FeaturePage
        title="Company profile"
        description={pageDescription}
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

  const overviewContent = (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CompanyProfileCard
            detail={detail}
            canEdit={canEdit}
            onEdit={() => openWizard(1)}
          />
        </div>
        <CompanyContactCard
          detail={detail}
          canEdit={canEdit}
          onEdit={() => openWizard(2)}
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        <div className="flex h-full min-h-[20rem] flex-col lg:col-span-2">
          <CompanyLocationCard
            detail={detail}
            canEdit={canEdit}
            onEdit={() => openWizard(4)}
            fillHeight
          />
        </div>
        <div className="flex flex-col gap-6">
          <CompanyAddressCard
            detail={detail}
            canEdit={canEdit}
            onEdit={() => openWizard(3)}
          />
          <CompanyTagsCard
            tags={detail.tags ?? []}
            canEdit={canEdit}
            onEdit={() => openWizard(5)}
          />
        </div>
      </div>
    </div>
  )

  const showMemberTabs = variant === 'member' && memberTabItems.length > 1

  return (
    <FeaturePage
      title={detail.name}
      description={pageDescription}
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

        {variant === 'member' ? (
          <>
            {showMemberTabs ? (
              <div
                role="tablist"
                aria-label="Company profile sections"
                className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
              >
                {memberTabItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`company-profile-tab-${item.id}`}
                    aria-selected={activeMemberTab === item.id}
                    aria-controls={`company-profile-panel-${item.id}`}
                    className={cn(
                      'rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors',
                      activeMemberTab === item.id && 'bg-background text-foreground shadow-sm',
                    )}
                    onClick={() => setMemberTab(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div
              role="tabpanel"
              id={`company-profile-panel-${activeMemberTab}`}
              aria-labelledby={`company-profile-tab-${activeMemberTab}`}
            >
              {activeMemberTab === 'overview' ? (
                overviewContent
              ) : (
                <MemberCompanyCatalogPanel companyId={companyId} kind={activeMemberTab} />
              )}
            </div>
          </>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Company profile sections"
              className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
            >
              {ADMIN_TAB_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`company-profile-tab-${item.id}`}
                  aria-selected={adminTab === item.id}
                  aria-controls={`company-profile-panel-${item.id}`}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors',
                    adminTab === item.id && 'bg-background text-foreground shadow-sm',
                  )}
                  onClick={() => setAdminTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`company-profile-panel-${adminTab}`}
              aria-labelledby={`company-profile-tab-${adminTab}`}
            >
              {adminTab === 'overview' ? (
                overviewContent
              ) : adminTab === 'gallery' ? (
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
          </>
        )}
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
    <CompanyProfilePage
      backTo="/settings/companies"
      backLabel="Back to My Company"
      variant="member"
    />
  )
}

export function AdminCompanyProfilePage() {
  return <CompanyProfilePage backTo="/companies" backLabel="Back to Companies" variant="admin" />
}
