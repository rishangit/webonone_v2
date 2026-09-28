import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ItemListMenu, ItemListMenuItem, useToast } from '@webonone/mobile-ui'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'

export function CompanyProductVariantsAiMenu({
  libraryEntityId,
  entityName,
}: {
  libraryEntityId: string
  entityName: string
}) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()

  return (
    <ItemListMenu ariaLabel={t('variantsTab.actionsFor', { name: entityName })}>
      <ItemListMenuItem
        onPress={() => {
          requestEntityPaste({
            entities: [
              {
                service: 'data',
                kind: 'product',
                id: libraryEntityId,
                label: entityName,
              },
            ],
            composerText: t('variantsTab.aiSuggestVariantsPrompt', { productName: entityName }),
          })
          toast({ title: t('variantsTab.aiSuggestVariantsSuccess') })
        }}
      >
        {t('variantsTab.aiSuggestVariants')}
      </ItemListMenuItem>
      <ItemListMenuItem
        onPress={() => {
          requestEntityPaste({
            entities: [
              {
                service: 'data',
                kind: 'product',
                id: libraryEntityId,
                label: entityName,
              },
            ],
          })
          toast({ title: t('attributesTab.copyToAiSuccess') })
        }}
      >
        {t('list.copyToAi')}
      </ItemListMenuItem>
    </ItemListMenu>
  )
}
