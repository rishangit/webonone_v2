import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DropdownMenuItem } from '@webonone/ui-kit'
import { resolvePlatformEmbedParentOrigin } from '@webonone/platform-embed'
import { useToast } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { CatalogEntityKind } from '@/features/catalog/utils/catalogAttributeApi'
import { copyCatalogAttributeToAi } from '@/features/shell/utils/copyCatalogAttributeToAi'

type CatalogAttributeAiMenuItemProps = {
  kind: CatalogEntityKind
  entityId: string
  entityName: string
  attributeId: string
  attributeName: string
  mode: 'copy' | 'suggest_values'
}

export function CatalogAttributeAiMenuItem({
  kind,
  entityId,
  entityName,
  attributeId,
  attributeName,
  mode,
}: CatalogAttributeAiMenuItemProps) {
  const { t } = useTranslation('shell')
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  if (!parentOrigin) {
    return null
  }

  function handleClick() {
    const composerText =
      mode === 'suggest_values'
        ? t('aiSuggestAttributeValuesPrompt', {
            attributeName,
            entityName,
          })
        : undefined
    const ok = copyCatalogAttributeToAi(searchParams, {
      kind,
      entityId,
      entityName,
      attributeId,
      attributeName,
      composerText,
    })
    if (ok) {
      toast({
        title:
          mode === 'suggest_values' ? t('aiSuggestAttributeValuesSuccess') : t('copyToAiSuccess'),
      })
      return
    }
    toast({
      title: t('copyToAiUnavailable'),
      variant: 'destructive',
    })
  }

  return (
    <DropdownMenuItem onClick={handleClick}>
      {mode === 'suggest_values' ? t('aiSuggestAttributeValues') : t('copyToAi')}
    </DropdownMenuItem>
  )
}
