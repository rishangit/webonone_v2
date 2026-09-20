import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, Spinner } from '@webonone/mobile-ui'
import { AiUserSettingsCard } from '@/features/settings/components/AiUserSettingsCard'
import { AiUserSettingsDialog } from '@/features/settings/components/AiUserSettingsDialog'
import { aiSettingsApi, type AiSettingsResponse } from '@/features/settings/services/aiSettingsApi'

export function AiSettingsPanel() {
  const { t } = useTranslation('settings')
  const [settings, setSettings] = useState<AiSettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSettings(await aiSettingsApi.getMine())
    } catch (err) {
      setSettings(null)
      setError(err instanceof Error ? err.message : t('ai.toast.saveFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <Spinner label={t('ai.loading')} />
  }

  return (
    <>
      {error && !dialogOpen ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <AiUserSettingsCard settings={settings} canEdit onEdit={() => setDialogOpen(true)} />

      <AiUserSettingsDialog
        open={dialogOpen}
        settings={settings}
        onOpenChange={setDialogOpen}
        onSaved={(saved) => {
          setSettings(saved)
          setError(null)
        }}
      />
    </>
  )
}
