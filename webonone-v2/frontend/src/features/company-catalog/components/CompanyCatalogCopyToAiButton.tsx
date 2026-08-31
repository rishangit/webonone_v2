import { useTranslation } from 'react-i18next'
import { Button, useToast } from '@webonone/ui-kit'
import type { CatalogAiEntityKind } from '@webonone/platform-embed'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'
import {
  CATALOG_ENTITY_SINGULAR_KEYS,
  type CatalogGalleryKind,
} from '../types/companyCatalog.types'

type CompanyCatalogCopyToAiButtonProps = {
  kind: CatalogGalleryKind
  id: string
  label: string
}

export function CompanyCatalogCopyToAiButton({
  kind,
  id,
  label,
}: CompanyCatalogCopyToAiButtonProps) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()

  function handleClick() {
    requestEntityPaste({
      service: 'webonone',
      kind: CATALOG_ENTITY_SINGULAR_KEYS[kind] as CatalogAiEntityKind,
      id,
      label,
    })
    toast({ title: t('list.copyToAiSuccess') })
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick}>
      {t('list.copyToAi')}
    </Button>
  )
}
