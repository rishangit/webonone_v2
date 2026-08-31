import { Button, ContactValueLine, type UserOption } from '@webonone/ui-kit'
import { User } from 'lucide-react'

type EventWizardStepAttendeeProps = {
  attendee: UserOption | null
  onOpenPicker: () => void
  error?: string
}

export function EventWizardStepAttendee({
  attendee,
  onOpenPicker,
  error,
}: EventWizardStepAttendeeProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose the Identity user who will attend this duration-based event.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {attendee ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{attendee.displayName}</p>
            <ContactValueLine kind="email" value={attendee.email} emptyLabel="No email" />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onOpenPicker}>
            Change
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={onOpenPicker}>
          <User className="mr-2 h-4 w-4" aria-hidden />
          Select attendee
        </Button>
      )}
    </div>
  )
}
