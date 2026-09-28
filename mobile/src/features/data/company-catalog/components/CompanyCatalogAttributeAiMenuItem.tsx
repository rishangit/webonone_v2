import { useTranslation } from 'react-i18next'
import { ItemListMenuItem, useToast } from '@webonone/mobile-ui'
import type { CatalogAiEntityKind } from '@webonone/platform-embed'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'
import { CATALOG_ENTITY_SINGULAR_KEYS } from '@/features/data/company-catalog/utils/catalogAiKinds'
import type { CatalogKind } from '@/features/data/utils/dataPaths'

export function CompanyCatalogAttributeAiMenuItem({
  kind,
  libraryEntityId,
  entityName,
  attributeId,
  attributeName,
  mode,
}: {
  kind: CatalogKind
  libraryEntityId: string
  entityName: string
  attributeId: string
  attributeName: string
  mode: 'copy' | 'suggest_values'
}) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()
  const catalogKind = CATALOG_ENTITY_SINGULAR_KEYS[kind] as CatalogAiEntityKind

  return (
    <ItemListMenuItem
      onPress={() => {
        requestEntityPaste({
          entities: [
            {
              service: 'data',
              kind: catalogKind,
              id: libraryEntityId,
              label: entityName,
            },
            {
              service: 'data',
              kind: 'attribute',
              id: attributeId,
              label: attributeName,
            },
          ],
          ...(mode === 'suggest_values'
            ? {
                composerText: t('attributesTab.aiSuggestValuesPrompt', {
                  attributeName,
                  entityName,
                }),
              }
            : {}),
        })
        toast({
          title:
            mode === 'suggest_values'
              ? t('attributesTab.aiSuggestValuesSuccess')
              : t('attributesTab.copyToAiSuccess'),
        })
      }}
    >
      {mode === 'suggest_values' ? t('attributesTab.aiSuggestValues') : t('attributesTab.copyToAi')}
    </ItemListMenuItem>
  )
}
