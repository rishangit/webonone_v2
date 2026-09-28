import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ItemListMenu, ItemListMenuItem, ItemListMenuSeparator } from '@webonone/mobile-ui'
import { CompanyCatalogCopyToAiMenuItem } from '@/features/data/company-catalog/components/CompanyCatalogCopyToAiMenuItem'
import type { CatalogKind } from '@/features/data/utils/dataPaths'

export function CompanyCatalogDetailPageMenu({
  kind,
  entityId,
  entityLabel,
  ariaLabel,
  canCustomize,
  canRemove,
  busy,
  onCustomize,
  onRemove,
}: {
  kind: CatalogKind
  entityId: string
  entityLabel: string
  ariaLabel: string
  canCustomize: boolean
  canRemove: boolean
  busy: boolean
  onCustomize: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')

  return (
    <View className="w-full flex-row justify-end">
      <ItemListMenu ariaLabel={ariaLabel}>
        <CompanyCatalogCopyToAiMenuItem kind={kind} id={entityId} label={entityLabel} />
        {canCustomize ? (
          <ItemListMenuItem disabled={busy} onPress={onCustomize}>
            {t('detail.customize')}
          </ItemListMenuItem>
        ) : null}
        {canRemove ? (
          <>
            <ItemListMenuSeparator />
            <ItemListMenuItem destructive disabled={busy} onPress={onRemove}>
              {tc('remove')}
            </ItemListMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    </View>
  )
}
