import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { websitePagesActions } from '../store'
import { websiteSettingsActions } from '../store/websiteSettingsStore'
import { WebsiteHubTabs } from '../components/WebsiteHubTabs'
import type { WebsitePage } from '../types'

const NONE_VALUE = '__none'

function pageLabel(page: WebsitePage): string {
  const pathLabel = page.path ? `/${page.path}` : '/'
  return `${page.name} (${pathLabel})`
}

export function WebsiteSettingsPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const companyId = user?.companyId ?? null
  const { settings, status, error } = useAppSelector((s) => s.websiteSettings)
  const pagesState = useAppSelector((s) => s.websitePages)
  const [homePageId, setHomePageId] = useState<string | null>(null)
  const prevStatusRef = useRef(status)

  const loading = status === 'loading' && !settings
  usePlatformLoading(loading ? t('loadingSettings') : null)

  useEffect(() => {
    if (!companyId) return
    dispatch(websiteSettingsActions.loadRequested({ companyId }))
    dispatch(
      websitePagesActions.loadListRequested({
        page: 1,
        pageSize: 100,
        status: 'active',
        force: true,
      }),
    )
  }, [companyId, dispatch])

  useEffect(() => {
    if (settings) {
      setHomePageId(settings.homePageId)
    }
  }, [settings])

  useEffect(() => {
    if (prevStatusRef.current === 'saving' && status === 'idle' && !error) {
      toast({ title: t('saved') })
    }
    prevStatusRef.current = status
  }, [status, error, t, toast])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!companyId) {
    return (
      <FeaturePage title={t('title')} description={t('settingsDescription')}>
        <WebsiteHubTabs section="settings" />
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  const activePages = (pagesState.items as WebsitePage[]).filter((page) => page.status === 'active')
  const selectedValue = homePageId ?? NONE_VALUE
  const isDirty = (settings?.homePageId ?? null) !== homePageId
  const isSaving = status === 'saving'

  return (
    <FeaturePage title={t('title')} description={t('settingsDescription')}>
      <WebsiteHubTabs section="settings" />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t('homePageSettingsTitle')}</CardTitle>
          <CardDescription>{t('homePageSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField label={t('homePage')} htmlFor="website-home-page">
            <Select
              value={selectedValue}
              onValueChange={(value) => setHomePageId(value === NONE_VALUE ? null : value)}
              disabled={!canManage || isSaving}
            >
              <SelectTrigger id="website-home-page">
                <SelectValue placeholder={t('homePagePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t('homePageDefault')}</SelectItem>
                {activePages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {pageLabel(page)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <p className="text-sm text-muted-foreground">{t('homePageHint')}</p>
          {canManage ? (
            <div className="flex justify-end">
              <Button
                type="button"
                className="h-10"
                disabled={!isDirty || isSaving}
                onClick={() => {
                  dispatch(
                    websiteSettingsActions.saveRequested({
                      companyId,
                      homePageId,
                    }),
                  )
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? t('saving') : tc('save')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </FeaturePage>
  )
}
