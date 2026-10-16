import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  AttributePickerListItem,
  Button,
  DropdownMenuItem,
  ItemList,
  ItemListEmpty,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { SpaceWizardFormValues } from '@/features/spaces/schemas/spaceSchemas'

interface SpaceWizardStepAttributesProps {
  values: SpaceWizardFormValues
  isSubmitting: boolean
  onOpenPicker: () => void
  onRemove: (attributeId: string) => void
}

export function SpaceWizardStepAttributes({
  values,
  isSubmitting,
  onOpenPicker,
  onRemove,
}: SpaceWizardStepAttributesProps) {
  const { t } = useTranslation('spaces')
  const { t: ta } = useTranslation('attributes')
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{t('attributes')}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onOpenPicker}
          disabled={isSubmitting}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('wizard.addAttribute')}
        </Button>
      </div>

      {values.attributes.length === 0 ? (
        <ItemListEmpty>{t('wizard.attributesEmpty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {values.attributes.map((row) => (
            <AttributePickerListItem
              key={row.attributeId}
              name={row.name || row.attributeId}
              description={row.description}
              valueTypeLabel={row.valueType === 'number' ? ta('number') : ta('text')}
              unit={row.unit}
              noUnitLabel={ta('pickerNoUnit')}
              trailing={
                <ItemListMenu
                  ariaLabel={t('wizard.actionsForAttribute', {
                    name: row.name || t('wizard.attributeFallback'),
                  })}
                >
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={isSubmitting}
                    onClick={() => onRemove(row.attributeId)}
                  >
                    {t('common:remove')}
                  </DropdownMenuItem>
                </ItemListMenu>
              }
            />
          ))}
        </ItemList>
      )}
    </div>
  )
}
