import { Globe, MapPin, User } from 'lucide-react'
import { ImagePreview } from '@webonone/ui-kit'
import type { UserProfile } from '@/shared/types/auth.types'
import type { ProfileWizardStep } from '../schemas/profileSchemas'
import { ContactVerifiedRow } from './ContactVerification'
import { EditableSectionCard } from './EditableSectionCard'

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
  canEdit?: boolean
  onEditSection?: (step: ProfileWizardStep) => void
  onVerifyEmail?: () => void
  onVerifyPhone?: () => void
}

export function ProfileView({
  user,
  avatarUrl,
  canEdit = true,
  onEditSection,
  onVerifyEmail,
  onVerifyPhone,
}: ProfileViewProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <EditableSectionCard
          title="Account"
          description="Identity and photo for this account"
          canEdit={canEdit}
          onEdit={onEditSection ? () => onEditSection(1) : undefined}
        >
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <ImagePreview
              src={avatarUrl}
              alt={user.displayName}
              mode="view"
              className="rounded-full"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <h2 className="text-xl font-semibold">{user.displayName}</h2>
              <ContactVerifiedRow
                label="Email"
                value={user.email}
                verified={user.isEmailVerified}
                canVerify={canEdit}
                onVerify={onVerifyEmail}
                verifyLabel="Verify email"
              />
              {user.isGoogleUser ? (
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
                  <span>Signed in with Google</span>
                </div>
              ) : null}
              {user.isGoogleUser ? (
                <p className="text-sm text-muted-foreground">
                  Name and photo were imported from Google. You can update your profile with Edit on
                  each section.
                </p>
              ) : null}
            </div>
          </div>
        </EditableSectionCard>

        <EditableSectionCard
          title="Address"
          description="Postal / street address"
          canEdit={canEdit}
          onEdit={onEditSection ? () => onEditSection(2) : undefined}
        >
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
        </EditableSectionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title="Contact"
          description="How others can reach you"
          canEdit={canEdit}
          onEdit={onEditSection ? () => onEditSection(3) : undefined}
        >
          <ContactVerifiedRow
            label="Phone number"
            value={user.phoneNumber}
            verified={user.isPhoneVerified}
            canVerify={canEdit}
            onVerify={onVerifyPhone}
            verifyLabel="Verify phone"
          />
          <ReadOnlyField label="Locale" value={user.locale} icon={Globe} />
        </EditableSectionCard>

        <EditableSectionCard
          title="Name"
          description="Legal and display names"
          canEdit={canEdit}
          onEdit={onEditSection ? () => onEditSection(4) : undefined}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField label="First name" value={user.firstName} icon={User} />
            <ReadOnlyField label="Last name" value={user.lastName} icon={User} />
          </div>
          <ReadOnlyField label="Display name" value={user.displayName} icon={User} />
        </EditableSectionCard>
      </div>
    </div>
  )
}
