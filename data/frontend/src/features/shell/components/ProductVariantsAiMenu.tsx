import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@webonone/ui-kit'
import { resolvePlatformEmbedParentOrigin } from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { ProductVariantAiMenuItem } from '@/features/shell/components/ProductVariantAiMenuItem'

type ProductVariantsAiMenuProps = {
  productId: string
  productName: string
}

export function ProductVariantsAiMenu({ productId, productName }: ProductVariantsAiMenuProps) {
  const { t } = useTranslation('shell')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  if (!parentOrigin) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-9">
          <Sparkles className="h-4 w-4" aria-hidden />
          {t('aiSuggestVariants')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ProductVariantAiMenuItem
          productId={productId}
          productName={productName}
          mode="suggest_variants"
        />
        <ProductVariantAiMenuItem
          productId={productId}
          productName={productName}
          mode="copy"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
