import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@webonone/ui-kit'
import { filterCompanyDataEntities, type CompanyDataEntityKey } from '@webonone/platform-nav'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import type { CompanyDetail } from '@/features/settings/basic/services/companyApi'
import { companyApi } from '@/features/settings/basic/services/companyApi'
import type { CompanyWizardStep } from '@/features/settings/basic/schemas/companySchemas'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import { MemberCompanyCatalogPanel } from './MemberCompanyCatalogPanel'
import { CompanyAddressCard } from './CompanyAddressCard'
import { CompanyContactCard } from './CompanyContactCard'
import { CompanyFormDialog } from './CompanyFormDialog'
import { CompanyLocationCard } from './CompanyLocationCard'
import { CompanyProfileCard } from './CompanyProfileCard'
import { CompanyTagsCard } from './CompanyTagsCard'

type MemberCatalogTab = CompanyDataEntityKey
type MemberProfileTab = 'overview' | MemberCatalogTab

const ALL_MEMBER_TABS = [
  'overview',
  'services',
  'products',
  'spaces',
] as const satisfies readonly MemberProfileTab[]

export type CompanyMemberProfileViewProps = {
  companyId: string
  previewMode?: boolean
  embedInDialog?: boolean
  onBack?: () => void
  backLabel?: string
}

export function CompanyMemberProfileView({
  companyId,
  previewMode = false,
  embedInDialog = false,
  onBack,
  backLabel,
}: CompanyMemberProfileViewProps) {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const storeDetail = useAppSelector((s) => s.companies.detail)
  const detailStatus = useAppSelector((s) => s.companies.detailStatus)
  const detailError = useAppSelector((s) => s.companies.detailError)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)

  const [memberTabUrl, setMemberTabUrl] = useDetailTabParam(ALL_MEMBER_TABS, 'overview')
  const [memberTabLocal, setMemberTabLocal] = useState<MemberProfileTab>('overview')
  const [dialog, setDialog] = useState<{ initialStep: CompanyWizardStep } | null>(null)
  const [previewDetail, setPreviewDetail] = useState<CompanyDetail | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const memberTab = previewMode ? memberTabLocal : memberTabUrl
  const setMemberTab = previewMode ? setMemberTabLocal : setMemberTabUrl

  useEffect(() => {
    if (previewMode) {
      setPreviewDetail(null)
      setPreviewError(null)
      setPreviewLoading(true)
      let cancelled = false
      void companyApi
        .getDiscoverableCompany(companyId)
        .then((data) => {
          if (!cancelled) {
            setPreviewDetail(data)
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setPreviewError(err instanceof Error ? err.message : t('companyProfile.loading'))
          }
        })
        .finally(() => {
          if (!cancelled) {
            setPreviewLoading(false)
          }
        })
      return () => {
        cancelled = true
      }
    }

    return undefined
  }, [companyId, previewMode, t])

  const detail = previewMode ? previewDetail : storeDetail?.id === companyId ? storeDetail : null
  const loading = previewMode
    ? previewLoading && !previewDetail
    : detailStatus === 'loading' && !detail
  const errorMessage = previewMode ? previewError : detailError

  usePlatformLoading(!embedInDialog && loading ? t('companyProfile.loading') : null)

  const canEdit =
    !previewMode &&
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

  const showConnectedCatalogTabs = memberTabItems.length > 1

  function openWizard(initialStep: CompanyWizardStep) {
    setDialog({ initialStep })
  }

  if (loading) {
    if (embedInDialog) {
      return (
        <div className="flex items-center justify-center gap-2 py-16">
          <Spinner size="lg" />
          <span className="text-sm text-muted-foreground">{t('companyProfile.loading')}</span>
        </div>
      )
    }
    return null
  }

  if (errorMessage && !detail) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  }

  if (!detail) {
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

  return (
    <div className="flex flex-col gap-4">
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit gap-1 px-0 text-foreground hover:bg-transparent"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel ?? t('connectedCompanies.findDialogBackToSearch')}
        </Button>
      ) : null}

      {!previewMode && errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

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
          {activeMemberTab === 'overview' ? (
            overviewContent
          ) : (
            <MemberCompanyCatalogPanel
              companyId={companyId}
              kind={activeMemberTab}
              previewMode={previewMode}
            />
          )}
        </TabsContent>
      </Tabs>

      {dialog && !previewMode ? (
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
    </div>
  )
}
