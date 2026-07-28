import { EditableSectionCard } from '@/features/settings/companies/components/EditableSectionCard'
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
        <p className="text-sm text-muted-foreground">No working days set.</p>
      ) : (
        <ul className="space-y-3">
          {staff.schedule.map((day) => {
            const label = DAY_LABELS[day.day_of_week] ?? `Day ${day.day_of_week}`
            return (
              <li
                key={day.day_of_week}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-foreground">{label}</span>
                <span className="text-muted-foreground">
                  {day.is_working && day.start_time && day.end_time
                    ? `${day.start_time} – ${day.end_time}`
                    : 'Off'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </EditableSectionCard>
  )
}
