import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Plus } from 'lucide-react'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListItem,
  itemListRowActiveClassName,
} from '@webonone/ui-kit'
import { getAddonModules } from '../registry'
import type { WebsiteAddon } from '../../types'

export const ADD_ADDON_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

interface AddAddonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddonAdded: (type: WebsiteAddon['type']) => void
}

export function AddAddonDialog({ open, onOpenChange, onAddonAdded }: AddAddonDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [pendingType, setPendingType] = useState<WebsiteAddon['type'] | null>(null)
  const modules = getAddonModules()

  function select(type: WebsiteAddon['type']) {
    setPendingType(type)
    onAddonAdded(type)
    onOpenChange(false)
    setPendingType(null)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setPendingType(null)
        onOpenChange(next)
      }}
      title={t('addAddonTitle')}
      description={t('addAddonDescription')}
      icon={<Plus className="h-5 w-5" />}
      sizeWidth={ADD_ADDON_DIALOG_SIZE.sizeWidth}
      sizeHeight={ADD_ADDON_DIALOG_SIZE.sizeHeight}
      footer={
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {tc('close')}
        </Button>
      }
    >
      <ItemList>
        {modules.map((module) => {
          const isSelected = pendingType === module.type
          return (
            <ItemListItem
              key={module.type}
              role="button"
              tabIndex={0}
              className={`cursor-pointer ${isSelected ? itemListRowActiveClassName : ''}`}
              aria-label={t(module.labelKey)}
              aria-pressed={isSelected}
              onClick={() => select(module.type)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  select(module.type)
                }
              }}
            >
              <ItemListContent>
                <p className="font-medium">{t(module.labelKey)}</p>
                <p className="text-xs text-muted-foreground">{t(module.descriptionKey)}</p>
              </ItemListContent>
              {isSelected ? <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden /> : null}
            </ItemListItem>
          )
        })}
      </ItemList>
    </CustomDialog>
  )
}
