import { FormField, Switch } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'

type WorkflowWizardStepAddItemsToggleProps = {
  addItemsEnabled: boolean
  onAddItemsEnabledChange: (value: boolean) => void
}

export function WorkflowWizardStepAddItemsToggle({
  addItemsEnabled,
  onAddItemsEnabledChange,
}: WorkflowWizardStepAddItemsToggleProps) {
  const { t } = useTranslation('catalog')

  return (
    <div className="space-y-2 border-t border-[hsl(var(--glass-border))] pt-4">
      <p className="text-sm text-muted-foreground">{t('workflowTab.addItemsHelp')}</p>
      <FormField label={t('workflowTab.addItems')} htmlFor="workflow-wizard-add-items">
        <div className="flex items-center gap-3">
          <Switch
            id="workflow-wizard-add-items"
            checked={addItemsEnabled}
            onCheckedChange={onAddItemsEnabledChange}
          />
          <span className="text-sm text-muted-foreground">
            {addItemsEnabled ? t('workflowTab.yes') : t('workflowTab.no')}
          </span>
        </div>
      </FormField>
    </div>
  )
}
