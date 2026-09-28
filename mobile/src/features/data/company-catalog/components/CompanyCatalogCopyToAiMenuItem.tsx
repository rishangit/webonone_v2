import { useTranslation } from 'react-i18next'
import { ItemListMenuItem, useToast } from '@webonone/mobile-ui'
import type { CatalogAiEntityKind } from '@webonone/platform-embed'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'
import { CATALOG_ENTITY_SINGULAR_KEYS } from '@/features/data/company-catalog/utils/catalogAiKinds'
import type { CatalogKind } from '@/features/data/utils/dataPaths'

export function CompanyCatalogCopyToAiMenuItem({
  kind,
  id,
  label,
}: {
  kind: CatalogKind
  id: string
  label: string
}) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()

  return (
    <ItemListMenuItem
      onPress={() => {
        requestEntityPaste({
          service: 'webonone',
          kind: CATALOG_ENTITY_SINGULAR_KEYS[kind] as CatalogAiEntityKind,
          id,
          label,
        })
        toast({ title: t('list.copyToAiSuccess') })
      }}
    >
      {t('list.copyToAi')}
    </ItemListMenuItem>
  )
}
