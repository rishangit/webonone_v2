import { View } from 'react-native'
import { filterCompanyDataEntities } from '@webonone/platform-nav'
import { Body, EditableSectionCard, Muted } from '@webonone/mobile-ui'
import type { CompanyDetail } from '@/features/companies/services/companyApi'

const DATA_ENTITY_LABELS: Record<string, string> = {
  products: 'Products',
  services: 'Services',
  spaces: 'Spaces',
}

export function CompanyDataPanel({
  detail,
  canEdit,
  onEdit,
}: {
  detail: CompanyDetail
  canEdit?: boolean
  onEdit?: () => void
}) {
  const selected = filterCompanyDataEntities(detail.dataEntities ?? [])

  return (
    <EditableSectionCard
      title="Data services"
      description="Catalog modules enabled for this company"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {selected.length === 0 ? (
        <Muted>No data services enabled yet.</Muted>
      ) : (
        <View className="gap-2">
          {selected.map((key) => (
            <Body key={key}>• {DATA_ENTITY_LABELS[key] ?? key}</Body>
          ))}
        </View>
      )}
    </EditableSectionCard>
  )
}
