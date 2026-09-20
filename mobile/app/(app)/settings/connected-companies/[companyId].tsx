import { useLocalSearchParams } from 'expo-router'
import { CompanyDetailScreen } from '@/features/companies/CompanyDetailScreen'

export default function ConnectedCompanyDetailRoute() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>()
  if (!companyId) return null

  return <CompanyDetailScreen companyId={companyId} variant="member" />
}
