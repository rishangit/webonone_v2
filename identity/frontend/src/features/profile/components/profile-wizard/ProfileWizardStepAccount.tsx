import { useTranslation } from 'react-i18next'
import { ContactValueLine } from '@webonone/ui-kit'
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
  const { t } = useTranslation('profile')

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
        <ContactValueLine
          kind="email"
          value={email}
          variant="detail"
          className="justify-center text-muted-foreground"
        />
      </div>
      {isGoogleUser ? (
        <p className="text-center text-sm text-muted-foreground">{t('wizard.googleImportHint')}</p>
      ) : null}
    </div>
  )
}
