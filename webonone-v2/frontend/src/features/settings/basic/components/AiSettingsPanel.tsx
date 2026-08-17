import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isFresh } from '@/shared/store/cacheUtils'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { useSuperAdminStatus } from '@/features/settings/basic/hooks/useSuperAdminStatus'
import { AiPlatformSettingsCard } from '@/features/settings/basic/components/AiPlatformSettingsCard'
import { AiPlatformSettingsDialog } from '@/features/settings/basic/components/AiPlatformSettingsDialog'
import { AiUserSettingsCard } from '@/features/settings/basic/components/AiUserSettingsCard'
import { AiUserSettingsDialog } from '@/features/settings/basic/components/AiUserSettingsDialog'
import { aiSettingsActions } from '@/features/settings/basic/store/aiSettingsSlice'

export function AiSettingsPanel() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const { isSuperAdmin } = useSuperAdminStatus()
  const { userSettings, platformSettings, userFetchedAt, platformFetchedAt, status, error } = useAppSelector(
    (s) => s.aiSettings,
  )
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false)

  const loading = status === 'loading' && !userSettings
  usePlatformLoading(loading ? t('ai.loading') : null)

  useEffect(() => {
    if (!isFresh(userFetchedAt)) {
      dispatch(aiSettingsActions.loadUserSettingsRequested())
    }
  }, [dispatch, userFetchedAt])

  useEffect(() => {
    if (isSuperAdmin && !isFresh(platformFetchedAt)) {
      dispatch(aiSettingsActions.loadPlatformSettingsRequested())
    }
  }, [dispatch, isSuperAdmin, platformFetchedAt])

  if (loading) {
    return null
  }

  return (
    <>
      {error && status === 'error' && !userDialogOpen && !platformDialogOpen ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AiUserSettingsCard
            settings={userSettings}
            canEdit
            onEdit={() => setUserDialogOpen(true)}
          />
        </div>

        {isSuperAdmin ? (
          <div className="flex flex-col gap-6 lg:col-span-1">
            <AiPlatformSettingsCard
              settings={platformSettings}
              canEdit
              onEdit={() => setPlatformDialogOpen(true)}
            />
          </div>
        ) : null}
      </div>

      <AiUserSettingsDialog
        open={userDialogOpen}
        settings={userSettings}
        onOpenChange={setUserDialogOpen}
      />

      {isSuperAdmin ? (
        <AiPlatformSettingsDialog
          open={platformDialogOpen}
          settings={platformSettings}
          onOpenChange={setPlatformDialogOpen}
        />
      ) : null}
    </>
  )
}
