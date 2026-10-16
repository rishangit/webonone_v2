import { useEffect, useState } from 'react'
import {
  dataLibraryApi,
  libraryItemToPayload,
} from '@/features/company-catalog/services/dataLibraryApi'
import type {
  CatalogEntityKind,
  CatalogGalleryKind,
  CatalogPayload,
  HydratedCatalogItem,
} from '@/features/company-catalog/types/companyCatalog.types'

export function useCatalogLibraryBaseline(
  kind: CatalogGalleryKind | CatalogEntityKind | null,
  detail: HydratedCatalogItem | null,
): CatalogPayload | null {
  const [baseline, setBaseline] = useState<CatalogPayload | null>(null)

  useEffect(() => {
    if (!detail?.libraryEntityId || !kind) {
      setBaseline(null)
      return
    }

    if (detail.bindingMode === 'linked' && detail.hydrated) {
      setBaseline(detail.hydrated)
      return
    }

    let cancelled = false
    setBaseline(null)
    ;(async () => {
      try {
        const library = await dataLibraryApi.get(kind, detail.libraryEntityId as string)
        if (!cancelled) setBaseline(libraryItemToPayload(kind, library))
      } catch {
        if (!cancelled) setBaseline(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [detail, kind])

  return baseline
}
