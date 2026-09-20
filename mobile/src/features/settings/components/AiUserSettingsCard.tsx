import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { EditableSectionCard, Muted, ReadOnlyField } from '@webonone/mobile-ui'
import { formatSavedApiKeyHint } from '@/features/settings/schemas/aiSettingsSchemas'
import type { AiSettingsResponse } from '@/features/settings/services/aiSettingsApi'

type AiUserSettingsCardProps = {
  settings: AiSettingsResponse | null
  canEdit?: boolean
  onEdit?: () => void
}

export function AiUserSettingsCard({ settings, canEdit, onEdit }: AiUserSettingsCardProps) {
  const { t } = useTranslation('settings')
  const configured = settings?.configured ?? false

  return (
    <EditableSectionCard
      title={t('ai.title')}
      description={t('ai.description')}
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {!configured ? (
        <View className="gap-2">
          <Muted className="text-sm">1. {t('ai.setup.step1')} ollama.com</Muted>
          <Muted className="text-sm">2. {t('ai.setup.step2')} ollama.com/settings/keys</Muted>
          <Muted className="text-sm">3. {t('ai.setup.step3')}</Muted>
        </View>
      ) : (
        <>
          <ReadOnlyField
            label={t('ai.fields.apiKey')}
            value={
              settings?.hasApiKey
                ? formatSavedApiKeyHint(settings.apiKeyHint)
                : t('ai.keyMissing')
            }
          />
          <ReadOnlyField label={t('ai.fields.model')} value={settings?.model} />
          <ReadOnlyField label={t('ai.fields.baseUrl')} value={settings?.baseUrl} />
          <ReadOnlyField
            label={t('ai.fields.timeoutMs')}
            value={settings ? String(settings.timeoutMs) : undefined}
          />
        </>
      )}
    </EditableSectionCard>
  )
}
