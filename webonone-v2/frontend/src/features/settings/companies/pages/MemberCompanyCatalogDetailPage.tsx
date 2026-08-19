import { useLocation, useParams } from 'react-router-dom'
import { CompanyCatalogDetailPage } from '@/features/company-catalog/pages/CompanyCatalogDetailPage'
import {
  companySettingsListPath,
  companySettingsProfilePath,
} from '../utils/companySettingsPaths'

/** Settings → My Companies / Connected Companies catalog item — same Data item layout, member read-only. */
export function MemberCompanyCatalogDetailPage() {
  const { companyId = '', kind = '' } = useParams()
  const { pathname } = useLocation()
  const listPath = companySettingsListPath(pathname)
  const backTo = companyId
    ? `${companySettingsProfilePath(listPath, companyId)}?tab=${kind || 'overview'}`
    : listPath

  return (
    <CompanyCatalogDetailPage
      companyId={companyId || undefined}
      backTo={backTo}
      readOnly
    />
  )
}
