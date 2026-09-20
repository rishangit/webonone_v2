import { useCallback, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  Body,
  FeatureScreen,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsPageClassName,
  tabsPageContentClassName,
  useToast,
} from '@webonone/mobile-ui'
import { CompanyFormDialog } from '@/features/companies/components/CompanyFormDialog'
import type { CompanyEditSection } from '@/features/companies/components/CompanyOverviewCards'
import type { CompanyGallerySection } from '@/features/companies/components/CompanyGalleryPanel'
import { CompanyDataPanel } from '@/features/companies/components/CompanyDataPanel'
import { CompanyGalleryPanel } from '@/features/companies/components/CompanyGalleryPanel'
import { CompanyOverviewTab } from '@/features/companies/components/CompanyOverviewCards'
import {
  parseCompanyWizardStep,
  type CompanyWizardStep,
} from '@/features/companies/schemas/companySchemas'
import { companyApi } from '@/features/companies/services/companyApi'

type CompanyDetailTab = 'overview' | 'gallery' | 'data'

const COMPANY_DETAIL_TABS: CompanyDetailTab[] = ['overview', 'gallery', 'data']

const TAB_LABELS: Record<CompanyDetailTab, string> = {
  overview: 'Overview',
  gallery: 'Gallery',
  data: 'Data',
}

const SECTION_TO_STEP: Record<CompanyEditSection, CompanyWizardStep> = {
  profile: 1,
  contact: 2,
  address: 3,
  location: 4,
  tags: 5,
}

function pageDescription(variant: 'admin' | 'member' | 'owner', role?: 'member' | 'company_admin'): string {
  if (variant === 'admin' || role === 'company_admin') {
    return 'Company profile, gallery, and enabled data services.'
  }
  return 'Company profile and catalog information.'
}

export function CompanyDetailScreen({
  companyId,
  title = 'Company',
  description,
  variant = 'owner',
}: {
  companyId: string
  title?: string
  description?: string
  variant?: 'admin' | 'member' | 'owner'
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof companyApi.getCompany>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<CompanyDetailTab>('overview')
  const [editDialog, setEditDialog] = useState<{ initialStep: CompanyWizardStep } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDetail(await companyApi.getCompany(companyId))
    } catch (err) {
      setDetail(null)
      setError(err instanceof Error ? err.message : 'Failed to load company')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const screenDescription =
    description ?? (detail ? pageDescription(variant, detail.role) : 'Company details')

  if (loading) {
    return (
      <FeatureScreen title={title} description={screenDescription} onBack={() => router.back()}>
        <Spinner label="Loading company…" />
      </FeatureScreen>
    )
  }

  if (error || !detail) {
    return (
      <FeatureScreen title={title} description={screenDescription} onBack={() => router.back()}>
        <Body className="text-destructive">{error ?? 'Company not found.'}</Body>
      </FeatureScreen>
    )
  }

  const showOwnerTabs = variant === 'admin' || detail.role === 'company_admin'
  const canEdit = variant === 'admin' || detail.role === 'company_admin'

  function handleEditSection(section: CompanyEditSection) {
    setEditDialog({ initialStep: SECTION_TO_STEP[section] })
  }

  function handleGalleryEdit(section: CompanyGallerySection) {
    toast({
      title: 'Edit on web for now',
      description: `Company ${section} editing uses the media picker and is available on the web app.`,
    })
  }

  function handleDataEdit() {
    toast({
      title: 'Edit on web for now',
      description: 'Data service toggles are available on the web company profile for now.',
    })
  }

  return (
    <FeatureScreen
      title={detail.name}
      description={screenDescription}
      onBack={() => router.back()}
    >
      {showOwnerTabs ? (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as CompanyDetailTab)}
          className={tabsPageClassName}
        >
          <TabsList aria-label="Company sections">
            {COMPANY_DETAIL_TABS.map((id) => (
              <TabsTrigger key={id} value={id}>
                {TAB_LABELS[id]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className={tabsPageContentClassName}>
            <CompanyOverviewTab
              detail={detail}
              canEdit={canEdit}
              onEditSection={handleEditSection}
            />
          </TabsContent>
          <TabsContent value="gallery" className={tabsPageContentClassName}>
            <CompanyGalleryPanel
              detail={detail}
              canEdit={canEdit}
              onEditSection={handleGalleryEdit}
            />
          </TabsContent>
          <TabsContent value="data" className={tabsPageContentClassName}>
            <CompanyDataPanel
              detail={detail}
              canEdit={canEdit}
              onEdit={() => handleDataEdit()}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <CompanyOverviewTab detail={detail} />
      )}

      {editDialog && canEdit ? (
        <CompanyFormDialog
          open
          id={companyId}
          initialStep={parseCompanyWizardStep(editDialog.initialStep)}
          detail={detail}
          onOpenChange={(open) => {
            if (!open) setEditDialog(null)
          }}
          onSaved={() => {
            setEditDialog(null)
            void load()
          }}
        />
      ) : null}
    </FeatureScreen>
  )
}
