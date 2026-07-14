import { Globe, MapPin, User } from 'lucide-react'
import { Button, ImagePreview } from '@webonone/ui-kit'
import type { UserProfile } from '@/shared/types/auth.types'

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | null | undefined
  icon?: typeof User
}) {
  const display = value?.trim() ? value : '—'
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 text-sm">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
        <span>{display}</span>
      </div>
    </div>
  )
}

interface ProfileViewProps {
  user: UserProfile
  avatarUrl: string | null
  onEdit: () => void
}

export function ProfileView({ user, avatarUrl, onEdit }: ProfileViewProps) {
  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <ImagePreview
          src={avatarUrl}
          alt={user.displayName}
          mode="view"
          className="rounded-full"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-xl font-semibold">{user.displayName}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
            {user.isEmailVerified ? <span>Email verified</span> : null}
            {user.isGoogleUser ? <span>Signed in with Google</span> : null}
          </div>
          {user.isGoogleUser ? (
            <p className="text-sm text-muted-foreground">
              Name and photo were imported from Google. You can update your profile below.
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Name</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="First name" value={user.firstName} icon={User} />
          <ReadOnlyField label="Last name" value={user.lastName} icon={User} />
        </div>
        <ReadOnlyField label="Display name" value={user.displayName} icon={User} />
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Contact</h3>
        <ReadOnlyField label="Phone number" value={user.phoneNumber} />
        <ReadOnlyField label="Locale" value={user.locale} icon={Globe} />
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Address</h3>
        <ReadOnlyField label="Address line 1" value={user.addressLine1} icon={MapPin} />
        <ReadOnlyField label="Address line 2" value={user.addressLine2} icon={MapPin} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="City" value={user.city} icon={MapPin} />
          <ReadOnlyField label="State / region" value={user.stateRegion} icon={MapPin} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Postal code" value={user.postalCode} icon={MapPin} />
          <ReadOnlyField label="Country" value={user.country} icon={Globe} />
        </div>
      </section>

      <Button type="button" onClick={onEdit}>
        Edit profile
      </Button>
    </div>
  )
}
