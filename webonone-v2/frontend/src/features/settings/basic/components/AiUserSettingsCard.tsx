import { useTranslation } from 'react-i18next'
import { formatSavedApiKeyHint } from '@/features/settings/basic/schemas/aiSettingsSchemas'
import type { AiSettingsResponse } from '@/features/settings/basic/services/aiSettingsApi'
import { EditableSectionCard } from '@/features/settings/basic/components/EditableSectionCard'

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value?.trim() ? value : '—'}</p>
    </div>
  )
}

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
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            {t('ai.setup.step1')}{' '}
            <a
              href="https://ollama.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              ollama.com
            </a>
          </li>
          <li>
            {t('ai.setup.step2')}{' '}
            <a
              href="https://ollama.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              ollama.com/settings/keys
            </a>
          </li>
          <li>{t('ai.setup.step3')}</li>
        </ol>
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
            value={settings ? String(settings.timeoutMs) : null}
          />
        </>
      )}
    </EditableSectionCard>
  )
}
