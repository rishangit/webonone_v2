import { Globe, MapPin, User } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ImagePreview,
} from '@webonone/ui-kit'
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
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
        <span>{display}</span>
      </div>
    </div>
  )
}

interface ProfileViewProps {
  user: UserProfile
  avatarUrl: string | null
}

export function ProfileView({ user, avatarUrl }: ProfileViewProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Identity and photo for this account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address</CardTitle>
            <CardDescription>Postal / street address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact</CardTitle>
            <CardDescription>How others can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReadOnlyField label="Phone number" value={user.phoneNumber} />
            <ReadOnlyField label="Locale" value={user.locale} icon={Globe} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Name</CardTitle>
            <CardDescription>Legal and display names</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="First name" value={user.firstName} icon={User} />
              <ReadOnlyField label="Last name" value={user.lastName} icon={User} />
            </div>
            <ReadOnlyField label="Display name" value={user.displayName} icon={User} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
