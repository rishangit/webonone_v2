import { UserRound } from 'lucide-react'
import { Button, ContactValueLine, FormField, ImagePreview, itemListThumbClassName } from '@webonone/ui-kit'
import type { StaffWizardFormValues } from '@/features/staff/schemas/staffSchemas'

type StaffWizardStepUserProps = {
  values: StaffWizardFormValues
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onSelectUser: () => void
  onClearUser: () => void
}

export function StaffWizardStepUser({
  values,
  fieldErrors,
  isSubmitting,
  onSelectUser,
  onClearUser,
}: StaffWizardStepUserProps) {
  const user = values.user

  return (
    <div className="space-y-4">
      <FormField label="Staff member" htmlFor="staff-wizard-user" required error={fieldErrors.user}>
        {user ? (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <ImagePreview
                src={user.avatarUrl}
                alt={user.displayName}
                mode="view"
                className={itemListThumbClassName}
              />
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium text-foreground">{user.displayName}</p>
                <ContactValueLine
                  kind="email"
                  value={user.email}
                  emptyLabel="No email"
                  verified={user.email?.trim() ? user.isEmailVerified : undefined}
                  className="[&_span]:whitespace-normal [&_span]:break-all"
                />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={onSelectUser}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={onClearUser}
              >
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <Button
            id="staff-wizard-user"
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={isSubmitting}
            onClick={onSelectUser}
          >
            <UserRound className="h-4 w-4" aria-hidden />
            Select user…
          </Button>
        )}
      </FormField>
    </div>
  )
}
