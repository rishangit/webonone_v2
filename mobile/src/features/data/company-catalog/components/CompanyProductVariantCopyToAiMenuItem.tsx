import { useTranslation } from 'react-i18next'
import { ItemListMenuItem, useToast } from '@webonone/mobile-ui'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'

export function CompanyProductVariantCopyToAiMenuItem({
  productId,
  productName,
  variantId,
  variantName,
}: {
  productId: string
  productName: string
  variantId: string
  variantName: string
}) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()

  return (
    <ItemListMenuItem
      onPress={() => {
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
      }}
    >
      {t('attributesTab.copyToAi')}
    </ItemListMenuItem>
  )
}
