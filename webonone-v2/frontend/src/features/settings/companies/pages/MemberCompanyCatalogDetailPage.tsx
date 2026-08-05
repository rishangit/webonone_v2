import { useParams } from 'react-router-dom'
import { CompanyCatalogDetailPage } from '@/features/company-catalog/pages/CompanyCatalogDetailPage'

/** Settings → My Companies / Connected Companies catalog item — same Data item layout, member read-only. */
export function MemberCompanyCatalogDetailPage() {
  const { companyId = '', kind = '' } = useParams()
  const backTo = companyId
    ? `/settings/companies/${companyId}?tab=${kind || 'overview'}`
    : '/settings/companies'

  return (
    <CompanyCatalogDetailPage
      companyId={companyId || undefined}
      backTo={backTo}
      readOnly
    />
  )
}
