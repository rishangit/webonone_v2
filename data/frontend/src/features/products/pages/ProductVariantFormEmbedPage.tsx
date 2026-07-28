import { useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription, Spinner } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { ProductVariantFormDialog } from '@/features/products/components/ProductVariantFormDialog'
import { dataApi } from '@/shared/services/dataApi'
import type { CatalogItem, ProductVariant } from '@/shared/types/data.types'

export function ProductVariantFormEmbedPage() {
  const { productId } = useParams<{ productId: string }>()
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  const [product, setProduct] = useState<CatalogItem | null>(null)
  const [existingVariants, setExistingVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [detail, variants] = await Promise.all([
          dataApi.getProduct(productId!),
          dataApi.listProductVariants(productId!),
        ])
        if (cancelled) return
        setProduct(detail)
        setExistingVariants(variants.items)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load product')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [productId])

  const hasDefaultVariant = existingVariants.some((item) => item.isDefault)

  if (!productId || !parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            This page is available only for platform peer dialog embeds.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>{error ?? 'Product not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <ProductVariantFormDialog
      chrome="embed-page"
      open
      productId={productId}
      productName={product.name}
      attributes={product.attributes}
      hasDefaultVariant={hasDefaultVariant}
      existingVariants={existingVariants}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSaved={(item: ProductVariant) =>
        sendPlatformPeerDialogComplete(parentOrigin, requestId, item)
      }
    />
  )
}
