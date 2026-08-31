import type { PosCartLine } from '@/features/sales/types/sales.types'

export function buildDefaultServiceLine(
  serviceId: string,
  serviceName: string,
  listPrice: number | null | undefined,
  imageUrl?: string | null,
): PosCartLine {
  return {
    key: `service-${serviceId}`,
    itemKind: 'service',
    catalogItemId: serviceId,
    name: serviceName,
    quantity: 1,
    unitPrice: listPrice ?? 0,
    imageUrl: imageUrl ?? null,
  }
}
