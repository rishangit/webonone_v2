import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
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
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import type { CompanyWizardStep } from '@/features/settings/basic/schemas/companySchemas'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import { CompanyMemberProfileView } from '../components/CompanyMemberProfileView'
import { CompanyAddressCard } from '../components/CompanyAddressCard'
import { CompanyContactCard } from '../components/CompanyContactCard'
import { CompanyDataEntitiesCard } from '../components/CompanyDataEntitiesCard'
import { CompanyFormDialog } from '../components/CompanyFormDialog'
import { CompanyGalleryCard } from '../components/CompanyGalleryCard'
import { CompanyLocationCard } from '../components/CompanyLocationCard'
import { CompanyLogoCard } from '../components/CompanyLogoCard'
import { CompanyProfileCard } from '../components/CompanyProfileCard'
import { CompanyTagsCard } from '../components/CompanyTagsCard'
import {
  CONNECTED_COMPANIES_PATH,
  MY_COMPANIES_PATH,
  companySettingsListPath,
} from '../utils/companySettingsPaths'

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

const ADMIN_TABS = [
  'overview',
  'gallery',
  'data',
] as const satisfies readonly AdminProfileTab[]

function membershipBackTo(
  pathname: string,
  role: 'member' | 'company_admin' | undefined,
): string {
  if (pathname.startsWith(CONNECTED_COMPANIES_PATH) || pathname.startsWith(MY_COMPANIES_PATH)) {
    return companySettingsListPath(pathname)
  }
  if (role === 'company_admin') return MY_COMPANIES_PATH
  return CONNECTED_COMPANIES_PATH
}

export function CompanyProfilePage({
  backTo: backToProp,
  variant = 'admin',
}: CompanyProfilePageProps) {
  const { t } = useTranslation('settings')
  const { companyId } = useParams<{ companyId: string }>()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const detail = useAppSelector((s) => s.companies.detail)
  const detailStatus = useAppSelector((s) => s.companies.detailStatus)
  const detailError = useAppSelector((s) => s.companies.detailError)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)

  const [adminTab, setAdminTab] = useDetailTabParam(ADMIN_TABS, 'overview')
  const [dialog, setDialog] = useState<{ initialStep: CompanyWizardStep } | null>(null)

  const loading = detailStatus === 'loading' && !detail
  const saving = detailStatus === 'saving'

  const backTo = backToProp ?? membershipBackTo(pathname, detail?.role)
  const backLabel =
    variant === 'admin'
      ? t('companyProfile.backToCompanies')
      : backTo === CONNECTED_COMPANIES_PATH
        ? t('companyProfile.backToConnectedCompanies')
        : t('companyProfile.backToMyCompanies')

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
    <CompanyMemberProfileView companyId={companyId} />
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
