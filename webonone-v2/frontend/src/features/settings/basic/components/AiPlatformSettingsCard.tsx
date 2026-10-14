import { useTranslation } from 'react-i18next'
import { EditableSectionCard, ReadOnlyField } from '@webonone/ui-kit'
import { formatSavedApiKeyHint } from '@/features/settings/basic/schemas/aiSettingsSchemas'
import type { AiSettingsResponse } from '@/features/settings/basic/services/aiSettingsApi'

type AiPlatformSettingsCardProps = {
  settings: AiSettingsResponse | null
  canEdit?: boolean
  onEdit?: () => void
}

export function AiPlatformSettingsCard({ settings, canEdit, onEdit }: AiPlatformSettingsCardProps) {
  const { t } = useTranslation('settings')

  return (
    <EditableSectionCard
      title={t('ai.platform.title')}
      description={t('ai.platform.description')}
      canEdit={canEdit}
      onEdit={onEdit}
    >
      <ReadOnlyField label={t('ai.fields.model')} value={settings?.model} />
      <ReadOnlyField label={t('ai.fields.baseUrl')} value={settings?.baseUrl} />
      <ReadOnlyField
        label={t('ai.fields.apiKey')}
        value={
          settings?.hasApiKey ? formatSavedApiKeyHint(settings.apiKeyHint) : t('ai.keyMissing')
        }
      />
      <ReadOnlyField
        label={t('ai.fields.timeoutMs')}
        value={settings ? String(settings.timeoutMs) : null}
      />
      <ReadOnlyField
        label={t('ai.platform.extraPrompt')}
        value={settings?.extraSystemPrompt}
      />
    </EditableSectionCard>
  )
}
