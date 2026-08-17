import { useTranslation } from 'react-i18next'
import { formatSavedApiKeyHint } from '@/features/settings/basic/schemas/aiSettingsSchemas'
import type { AiSettingsResponse } from '@/features/settings/basic/services/aiSettingsApi'
import { EditableSectionCard } from '@/features/settings/basic/components/EditableSectionCard'

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm break-words">{value?.trim() ? value : '—'}</p>
    </div>
  )
}

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
