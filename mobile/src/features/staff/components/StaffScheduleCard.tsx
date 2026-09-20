import { View } from 'react-native'
import { Body, EditableSectionCard, Muted } from '@webonone/mobile-ui'
import { DAY_LABELS } from '@/features/staff/schemas/staffSchemas'
import type { CompanyStaff } from '@/features/staff/types/staff.types'

type StaffScheduleCardProps = {
  staff: CompanyStaff
  canEdit?: boolean
  onEdit?: () => void
}

export function StaffScheduleCard({ staff, canEdit, onEdit }: StaffScheduleCardProps) {
  const workingDays = staff.schedule.filter((day) => day.is_working)

  return (
    <EditableSectionCard
      title="Work schedule"
      description="Weekly working days and hours"
      canEdit={canEdit}
      onEdit={onEdit}
    >
      {workingDays.length === 0 ? (
        <Muted>No working days set.</Muted>
      ) : (
        <View className="gap-3">
          {staff.schedule.map((day) => {
            const label = DAY_LABELS[day.day_of_week] ?? `Day ${day.day_of_week}`
            return (
              <View key={day.day_of_week} className="flex-row items-center justify-between gap-3">
                <Body>{label}</Body>
                <Muted>
                  {day.is_working && day.start_time && day.end_time
                    ? `${day.start_time} – ${day.end_time}`
                    : 'Off'}
                </Muted>
              </View>
            )
          })}
        </View>
      )}
    </EditableSectionCard>
  )
}
