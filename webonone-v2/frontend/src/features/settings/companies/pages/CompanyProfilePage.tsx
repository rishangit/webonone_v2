import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  backTo?: string
  /**
   * Route shell: `admin` = super-admin companies list (always Gallery/Data).
   * `member` = settings route — tab mode follows membership role
   * (`company_admin` → Gallery/Data; `member` → Our Products/Services/Spaces).
   */
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

const ALL_MEMBER_TABS = [
  'overview',
  'services',
  'products',
  'spaces',
] as const satisfies readonly MemberProfileTab[]

function membershipBackTo(role: 'member' | 'company_admin' | undefined): string {
  if (role === 'company_admin') return '/settings/companies'
  return '/settings/connected-companies'
}

export function CompanyProfilePage({
  backTo: backToProp,
  variant = 'admin',
}: CompanyProfilePageProps) {
  const { t } = useTranslation('settings')
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

  const backTo = backToProp ?? membershipBackTo(detail?.role)
  const backLabel =
    variant === 'admin'
      ? t('companyProfile.backToCompanies')
      : detail?.role === 'company_admin'
        ? t('companyProfile.backToMyCompanies')
        : t('companyProfile.backToConnectedCompanies')

  usePlatformLoading(loading ? t('companyProfile.loading') : null)

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
      { id: 'overview', label: t('companyProfile.tabs.overview') },
    ]
    for (const key of memberCatalogTabs) {
      const labelKey =
        key === 'services'
          ? 'companyProfile.tabs.ourServices'
          : key === 'products'
            ? 'companyProfile.tabs.ourProducts'
            : 'companyProfile.tabs.ourSpaces'
      items.push({ id: key, label: t(labelKey) })
    }
    return items
  }, [memberCatalogTabs, t])

  const activeMemberTab: MemberProfileTab =
    memberTab !== 'overview' && !memberCatalogTabs.includes(memberTab) ? 'overview' : memberTab

  function openWizard(initialStep: CompanyWizardStep) {
    setDialog({ initialStep })
  }

  if (loading) {
    return null
  }

  const pageDescription =
    variant === 'admin' || detail?.role === 'company_admin'
      ? t('companyProfile.descriptionOwner')
      : t('companyProfile.descriptionMember')

  if (detailError && !detail) {
    return (
      <FeaturePage
        title={t('companyProfile.title')}
        description={pageDescription}
        onBack={() => navigate(backTo)}
        backLabel={backLabel}
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

  const isOwnerTabs = variant === 'admin' || detail.role === 'company_admin'
  const isConnectedTabs = variant === 'member' && detail.role === 'member'
  const showConnectedCatalogTabs = isConnectedTabs && memberTabItems.length > 1

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

  const ownerTabsContent = (
    <Tabs
      value={adminTab}
      onValueChange={(value) => setAdminTab(value as AdminProfileTab)}
      className="flex flex-col gap-6"
    >
      <TabsList aria-label={t('companyProfile.ariaSections')}>
        {ADMIN_TABS.map((id) => (
          <TabsTrigger key={id} value={id}>
            {t(`companyProfile.tabs.${id}`)}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={adminTab} className="mt-0 outline-none">
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
      </TabsContent>
    </Tabs>
  )

  const connectedTabsContent = (
    <Tabs
      value={activeMemberTab}
      onValueChange={(value) => setMemberTab(value as MemberProfileTab)}
      className="flex flex-col gap-6"
    >
      {showConnectedCatalogTabs ? (
        <TabsList aria-label={t('companyProfile.ariaSections')}>
          {memberTabItems.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      ) : null}

      <TabsContent value={activeMemberTab} className="mt-0 outline-none">
        {activeMemberTab === 'overview' || !isConnectedTabs ? (
          overviewContent
        ) : (
          <MemberCompanyCatalogPanel companyId={companyId} kind={activeMemberTab} />
        )}
      </TabsContent>
    </Tabs>
  )

  return (
    <FeaturePage
      title={detail.name}
      description={pageDescription}
      onBack={() => navigate(backTo)}
      backLabel={backLabel}
    >
      <div className="flex flex-col gap-6">
        {detailError ? (
          <Alert variant="destructive">
            <AlertDescription>{detailError}</AlertDescription>
          </Alert>
        ) : null}

        {isOwnerTabs ? ownerTabsContent : connectedTabsContent}
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
  return <CompanyProfilePage variant="member" />
}

export function AdminCompanyProfilePage() {
  return <CompanyProfilePage backTo="/companies" variant="admin" />
}
