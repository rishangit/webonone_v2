import { Navigate, useParams } from 'react-router-dom'
import { useAppSelector } from '@/app/store/hooks'
import { CompanyCatalogDetailPage } from '@/features/company-catalog/pages/CompanyCatalogDetailPage'
import { CompanyCatalogListPage } from '@/features/company-catalog/pages/CompanyCatalogListPage'
import { CompanyProductVariantDetailsPage } from '@/features/company-catalog/pages/CompanyProductVariantDetailsPage'
import { CompanyCatalogAttributeDetailsPage } from '@/features/company-catalog/pages/CompanyCatalogAttributeDetailsPage'
import { canAccessCompanySession } from '@/features/session/utils/canAccessCompanySession'
import { PlatformPeerFrame } from '@/features/shell/pages/PlatformPeerFrame'
import {
  CATALOG_ENTITY_KINDS,
  isCatalogGalleryKind,
  type CatalogEntityKind,
} from '@/features/company-catalog/types/companyCatalog.types'

function isCatalogEntityKind(value: string): value is CatalogEntityKind {
  return (CATALOG_ENTITY_KINDS as readonly string[]).includes(value)
}

/** Company catalog list for company_admin / staff; super_admin Data library embed. */
export function DataCatalogListRoute() {
  const { kind: kindParam = '' } = useParams()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)

  if (activeRole === 'super_admin') {
    return <PlatformPeerFrame peer="data" />
  }

  if (!canAccessCompanySession(activeRole, activeCompanyId)) {
    return <Navigate to="/" replace />
  }

  if (!isCatalogEntityKind(kindParam) || !isCatalogGalleryKind(kindParam)) {
    return <Navigate to="/" replace />
  }

  return <CompanyCatalogListPage kind={kindParam} />
}

/** Company catalog detail for company_admin / staff; super_admin Data library embed. */
export function DataCatalogDetailRoute() {
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)

  if (activeRole === 'super_admin') {
    return <PlatformPeerFrame peer="data" />
  }

  if (!canAccessCompanySession(activeRole, activeCompanyId)) {
    return <Navigate to="/" replace />
  }

  return <CompanyCatalogDetailPage />
}

/**
 * Product variant details — company catalog for company_admin / staff;
 * Data library embed for super_admin.
 */
export function DataCatalogVariantDetailRoute() {
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)

  if (activeRole === 'super_admin') {
    return <PlatformPeerFrame peer="data" />
  }

  if (!canAccessCompanySession(activeRole, activeCompanyId)) {
    return <Navigate to="/" replace />
  }

  return <CompanyProductVariantDetailsPage />
}

/**
 * Catalog attribute details — company catalog for company_admin / staff;
 * Data library embed for super_admin.
 */
export function DataCatalogAttributeDetailRoute() {
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)

  if (activeRole === 'super_admin') {
    return <PlatformPeerFrame peer="data" />
  }

  if (!canAccessCompanySession(activeRole, activeCompanyId)) {
    return <Navigate to="/" replace />
  }

  return <CompanyCatalogAttributeDetailsPage />
}

/** Catch-all Data paths (e.g. unknown) — super_admin library; others home. */
export function DataLibraryCatchAllRoute() {
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  if (activeRole === 'super_admin') {
    return <PlatformPeerFrame peer="data" />
  }
  return <Navigate to="/" replace />
}
