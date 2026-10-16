import { useTranslation } from 'react-i18next'
import { DropdownMenuItem, useToast } from '@webonone/ui-kit'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'

type CompanyProductVariantCopyToAiMenuItemProps = {
  productId: string
  productName: string
  variantId: string
  variantName: string
}

export function CompanyProductVariantCopyToAiMenuItem({
  productId,
  productName,
  variantId,
  variantName,
}: CompanyProductVariantCopyToAiMenuItemProps) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()

  function handleClick() {
    requestEntityPaste({
      entities: [
        {
          service: 'webonone',
          kind: 'product',
          id: productId,
          label: productName.trim() || variantName,
        },
      ],
      composerText: `Focus on variant "${variantName}" (variantId: ${variantId}). List existing stocks with list_company_product_variant_stocks, then suggest or create stock batches with create_company_product_variant_stock when asked.`,
    })
    toast({ title: t('attributesTab.copyToAiSuccess') })
  }

  return <DropdownMenuItem onClick={handleClick}>{t('attributesTab.copyToAi')}</DropdownMenuItem>
}
