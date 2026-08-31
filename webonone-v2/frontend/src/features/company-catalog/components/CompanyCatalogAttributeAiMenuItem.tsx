import { useTranslation } from 'react-i18next'
import { DropdownMenuItem } from '@webonone/ui-kit'
import { useToast } from '@webonone/ui-kit'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'
import type { CatalogGalleryKind } from '../types/companyCatalog.types'

const CATALOG_AI_KIND = {
  products: 'product',
  services: 'service',
  spaces: 'space',
} as const

type CompanyCatalogAttributeAiMenuItemProps = {
  kind: CatalogGalleryKind
  libraryEntityId: string
  entityName: string
  attributeId: string
  attributeName: string
  mode: 'copy' | 'suggest_values'
}

export function CompanyCatalogAttributeAiMenuItem({
  kind,
  libraryEntityId,
  entityName,
  attributeId,
  attributeName,
  mode,
}: CompanyCatalogAttributeAiMenuItemProps) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()

  function handleClick() {
    const catalogKind = CATALOG_AI_KIND[kind]
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
  }

  return (
    <DropdownMenuItem onClick={handleClick}>
      {mode === 'suggest_values'
        ? t('attributesTab.aiSuggestValues')
        : t('attributesTab.copyToAi')}
    </DropdownMenuItem>
  )
}
