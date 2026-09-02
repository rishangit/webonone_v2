import { FormField, Switch } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { WorkflowWizardStepAddItemsToggle } from '@/features/company-catalog/components/workflow-wizard/WorkflowWizardStepAddItemsToggle'

type WorkflowWizardStepQueueProps = {
  sessionQueue: boolean
  onChange: (sessionQueue: boolean) => void
  addItemsEnabled: boolean
  onAddItemsEnabledChange: (addItemsEnabled: boolean) => void
  addItemsFromLibraryEnabled: boolean
  onAddItemsFromLibraryEnabledChange: (addItemsFromLibraryEnabled: boolean) => void
}

export function WorkflowWizardStepQueue({
  sessionQueue,
  onChange,
  addItemsEnabled,
  onAddItemsEnabledChange,
  addItemsFromLibraryEnabled,
  onAddItemsFromLibraryEnabledChange,
}: WorkflowWizardStepQueueProps) {
  const { t } = useTranslation('catalog')

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('workflowTab.sessionQueueHelp')}</p>
      <FormField label={t('workflowTab.sessionQueue')} htmlFor="workflow-wizard-session-queue">
        <div className="flex items-center gap-3">
          <Switch
            id="workflow-wizard-session-queue"
            checked={sessionQueue}
            onCheckedChange={onChange}
          />
          <span className="text-sm text-muted-foreground">
            {sessionQueue ? t('workflowTab.yes') : t('workflowTab.no')}
          </span>
        </div>
      </FormField>
      <WorkflowWizardStepAddItemsToggle
        addItemsEnabled={addItemsEnabled}
        onAddItemsEnabledChange={onAddItemsEnabledChange}
        addItemsFromLibraryEnabled={addItemsFromLibraryEnabled}
        onAddItemsFromLibraryEnabledChange={onAddItemsFromLibraryEnabledChange}
      />
    </div>
  )
}