import { ProfileAvatarEditor } from '../ProfileAvatarEditor'

interface ProfileWizardStepAccountProps {
  displayName: string
  email: string
  avatarUrl: string | null
  isGoogleUser: boolean
  isSubmitting: boolean
  onEditImage: () => void
}

export function ProfileWizardStepAccount({
  displayName,
  email,
  avatarUrl,
  isGoogleUser,
  isSubmitting,
  onEditImage,
}: ProfileWizardStepAccountProps) {
  return (
    <div className="space-y-4">
      <ProfileAvatarEditor
        displayName={displayName}
        avatarUrl={avatarUrl}
        onEditImage={() => {
          if (isSubmitting) return
          onEditImage()
        }}
      />
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>
      {isGoogleUser ? (
        <p className="text-center text-sm text-muted-foreground">
          Name and photo were imported from Google. You can change your photo here and update
          contact details in later steps.
        </p>
      ) : null}
    </div>
  )
}
