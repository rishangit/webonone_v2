import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Save } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Body,
  Button,
  Card,
  FeatureScreen,
  FormField,
  Muted,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Spinner,
  Subheading,
  useThemeColors,
  useToast,
} from '@webonone/mobile-ui'
import { WebsiteHubTabs } from '@/features/design/website/components/WebsiteHubTabs'
import { WebsiteNeedCompany } from '@/features/design/website/components/WebsiteNeedCompany'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import type { WebsitePage, WebsiteSiteSettings } from '@/features/design/website/types'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

const NONE = '__none'

export function WebsiteSettingsScreen() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const colors = useThemeColors()
  const { canManage, hasCompany } = useDesignPermissions()
  const [settings, setSettings] = useState<WebsiteSiteSettings | null>(null)
  const [pages, setPages] = useState<WebsitePage[]>([])
  const [homePageId, setHomePageId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasCompany) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      websiteAdminApi.getSettings(),
      websiteAdminApi.listPages({ page: 1, pageSize: 100, status: 'active' }),
    ])
      .then(([nextSettings, pageList]) => {
        if (cancelled) return
        setSettings(nextSettings)
        setHomePageId(nextSettings.homePageId)
        setPages(pageList.items.filter((page) => page.status === 'active'))
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('saveFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [hasCompany, t])

  async function handleSave() {
    setSaving(true)
    try {
      const next = await websiteAdminApi.updateSettings({ homePageId })
      setSettings(next)
      toast({ title: t('saved') })
    } catch (err) {
      toast({
        title: t('saveFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!hasCompany) return <WebsiteNeedCompany section="settings" description={t('settingsDescription')} />

  const dirty = (settings?.homePageId ?? null) !== homePageId

  return (
    <FeatureScreen title={t('title')} description={t('settingsDescription')}>
      <WebsiteHubTabs section="settings" />
      {loading ? <Spinner label={t('loadingSettings')} /> : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <Card>
          <View className="gap-4">
            <Subheading>{t('homePageSettingsTitle')}</Subheading>
            <Muted>{t('homePageSettingsDescription')}</Muted>
            <FormField label={t('homePage')}>
              <Select
                value={homePageId ?? NONE}
                onValueChange={(value) => setHomePageId(value === NONE ? null : value)}
                disabled={!canManage || saving}
              >
                <SelectTrigger />
                <SelectContent>
                  <SelectItem value={NONE}>{t('homePageDefault')}</SelectItem>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {`${page.name} (${page.path ? `/${page.path}` : '/'})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <Muted>{t('homePageHint')}</Muted>
            {canManage ? (
              <Button onPress={() => void handleSave()} disabled={!dirty || saving}>
                <Save size={16} color={colors.primaryText} strokeWidth={2} />
                <Body className="text-base font-medium text-primary-foreground">
                  {saving ? t('saving') : tc('save')}
                </Body>
              </Button>
            ) : null}
          </View>
        </Card>
      ) : null}
    </FeatureScreen>
  )
}
