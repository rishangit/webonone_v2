import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Button,
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { ProductWizardFormValues } from '@/features/products/schemas/productSchemas'

interface ProductWizardStepAttributesProps {
  values: ProductWizardFormValues
  isSubmitting: boolean
  onOpenPicker: () => void
  onRemove: (attributeId: string) => void
}

export function ProductWizardStepAttributes({
  values,
  isSubmitting,
  onOpenPicker,
  onRemove,
}: ProductWizardStepAttributesProps) {
  const { t } = useTranslation('products')
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
            <ItemListItem key={row.attributeId}>
              <ItemListContent>
                <p className="truncate font-medium">{row.name || row.attributeId}</p>
                <p className="truncate text-sm text-muted-foreground">
                  <span className="capitalize">{row.valueType}</span>
                  {row.unit ? ` · ${row.unit.name} (${row.unit.symbol})` : ''}
                </p>
              </ItemListContent>
              <ItemListMenu ariaLabel={t('wizard.actionsForAttribute', { name: row.name || t('wizard.attributeFallback') })}>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={isSubmitting}
                  onClick={() => onRemove(row.attributeId)}
                >
                  {t('common:remove')}
                </DropdownMenuItem>
              </ItemListMenu>
            </ItemListItem>
          ))}
        </ItemList>
      )}
    </div>
  )
}
