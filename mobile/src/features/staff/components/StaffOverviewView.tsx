import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Card,
  EditableSectionCard,
  Muted,
  ReadOnlyField,
  Subheading,
} from '@webonone/mobile-ui'
import { StaffScheduleCard } from '@/features/staff/components/StaffScheduleCard'
import type { CompanyStaff } from '@/features/staff/types/staff.types'
import type { StaffWizardStep } from '@/features/staff/schemas/staffSchemas'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

type StaffOverviewViewProps = {
  staff: CompanyStaff
  canEdit: boolean
  onEditStep: (step: StaffWizardStep) => void
}

export function StaffOverviewView({ staff, canEdit, onEditStep }: StaffOverviewViewProps) {
  const { t } = useTranslation('staff')

  return (
    <View className="gap-6">
      <StaffScheduleCard staff={staff} canEdit={canEdit} onEdit={() => onEditStep(2)} />

      <EditableSectionCard
        title={t('userCard.title')}
        description={t('userCard.description')}
        canEdit={canEdit}
        onEdit={() => onEditStep(1)}
      >
        <ReadOnlyField label={t('userCard.name')} value={staff.displayName} />
        <ReadOnlyField label={t('userCard.email')} value={staff.email?.trim() || '—'} />
      </EditableSectionCard>

      <Card className="gap-3">
        <Subheading>{t('detail.recordTitle')}</Subheading>
        <Muted>{t('detail.recordDescription')}</Muted>
        <ReadOnlyField label={t('detail.added')} value={formatDisplayDateTime(staff.createdAt)} />
        <ReadOnlyField label={t('detail.updated')} value={formatDisplayDateTime(staff.updatedAt)} />
      </Card>
    </View>
  )
}
