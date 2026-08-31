import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DropdownMenuItem } from '@webonone/ui-kit'
import { resolvePlatformEmbedParentOrigin } from '@webonone/platform-embed'
import { useToast } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { copyProductVariantsToAi } from '@/features/shell/utils/copyProductVariantsToAi'

type ProductVariantAiMenuItemProps = {
  productId: string
  productName: string
  mode: 'copy' | 'suggest_variants'
}

export function ProductVariantAiMenuItem({
  productId,
  productName,
  mode,
}: ProductVariantAiMenuItemProps) {
  const { t } = useTranslation('shell')
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  if (!parentOrigin) {
    return null
  }

  function handleClick() {
    const composerText =
      mode === 'suggest_variants'
        ? t('aiSuggestVariantsPrompt', {
            productName,
          })
        : undefined
    const ok = copyProductVariantsToAi(searchParams, {
      productId,
      productName,
      composerText,
    })
    if (ok) {
      toast({
        title:
          mode === 'suggest_variants' ? t('aiSuggestVariantsSuccess') : t('copyToAiSuccess'),
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
      {mode === 'suggest_variants' ? t('aiSuggestVariants') : t('copyToAi')}
    </DropdownMenuItem>
  )
}
