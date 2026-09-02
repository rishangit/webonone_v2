import { FormField, Switch } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'

type WorkflowWizardStepAddItemsToggleProps = {
  addItemsEnabled: boolean
  onAddItemsEnabledChange: (value: boolean) => void
  addItemsFromLibraryEnabled?: boolean
  onAddItemsFromLibraryEnabledChange?: (value: boolean) => void
}

export function WorkflowWizardStepAddItemsToggle({
  addItemsEnabled,
  onAddItemsEnabledChange,
  addItemsFromLibraryEnabled = false,
  onAddItemsFromLibraryEnabledChange,
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
            onCheckedChange={(checked) => {
              onAddItemsEnabledChange(checked)
              if (!checked) onAddItemsFromLibraryEnabledChange?.(false)
            }}
          />
          <span className="text-sm text-muted-foreground">
            {addItemsEnabled ? t('workflowTab.yes') : t('workflowTab.no')}
          </span>
        </div>
      </FormField>
      {addItemsEnabled && onAddItemsFromLibraryEnabledChange ? (
        <div className="space-y-2 border-t border-[hsl(var(--glass-border))] pt-4">
          <p className="text-sm text-muted-foreground">{t('workflowTab.addItemsFromLibraryHelp')}</p>
          <FormField
            label={t('workflowTab.addItemsFromLibrary')}
            htmlFor="workflow-wizard-add-items-from-library"
          >
            <div className="flex items-center gap-3">
              <Switch
                id="workflow-wizard-add-items-from-library"
                checked={addItemsFromLibraryEnabled}
                onCheckedChange={onAddItemsFromLibraryEnabledChange}
              />
              <span className="text-sm text-muted-foreground">
                {addItemsFromLibraryEnabled ? t('workflowTab.yes') : t('workflowTab.no')}
              </span>
            </div>
          </FormField>
        </div>
      ) : null}
    </div>
  )
}
