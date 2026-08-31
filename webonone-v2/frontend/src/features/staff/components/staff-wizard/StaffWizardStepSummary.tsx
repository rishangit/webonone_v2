import { ContactValueLine } from '@webonone/ui-kit'
import {
  DAY_LABELS,
  formatWorkingDaysSummary,
  type StaffWizardFormValues,
} from '@/features/staff/schemas/staffSchemas'

type StaffWizardStepSummaryProps = {
  values: StaffWizardFormValues
}

export function StaffWizardStepSummary({ values }: StaffWizardStepSummaryProps) {
  const user = values.user
  const workingDays = values.schedule.filter((day) => day.is_working)

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <h4 className="text-sm font-medium text-foreground">User</h4>
        <div className="space-y-1">
          <p className="text-sm text-foreground">{user?.displayName ?? '—'}</p>
          <ContactValueLine kind="email" value={user?.email} emptyLabel="No email" />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
        <h4 className="text-sm font-medium text-foreground">Work schedule</h4>
        <p className="text-xs text-muted-foreground">{formatWorkingDaysSummary(values.schedule)}</p>
        {workingDays.length === 0 ? (
          <p className="text-sm text-muted-foreground">No working days selected.</p>
        ) : (
          <ul className="space-y-2">
            {workingDays.map((day) => (
              <li key={day.day_of_week} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{DAY_LABELS[day.day_of_week]}</span>
                <span className="text-muted-foreground">
                  {day.start_time} – {day.end_time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
