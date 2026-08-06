import { Globe, MapPin, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('profile')

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <EditableSectionCard
          title={t('account')}
          description={t('accountDescription')}
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
                label={t('email')}
                value={user.email}
                verified={user.isEmailVerified}
                canVerify={canEdit}
                onVerify={onVerifyEmail}
                verifyLabel={t('verifyEmail')}
              />
              {user.isGoogleUser ? (
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
                  <span>{t('signedInWithGoogle')}</span>
                </div>
              ) : null}
              {user.isGoogleUser ? (
                <p className="text-sm text-muted-foreground">{t('googleImportedNotice')}</p>
              ) : null}
            </div>
          </div>
        </EditableSectionCard>

        <EditableSectionCard
          title={t('address')}
          description={t('addressDescription')}
          canEdit={canEdit}
          onEdit={onEditSection ? () => onEditSection(2) : undefined}
        >
          <ReadOnlyField label={t('addressLine1')} value={user.addressLine1} icon={MapPin} />
          <ReadOnlyField label={t('addressLine2')} value={user.addressLine2} icon={MapPin} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField label={t('city')} value={user.city} icon={MapPin} />
            <ReadOnlyField label={t('stateRegion')} value={user.stateRegion} icon={MapPin} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField label={t('postalCode')} value={user.postalCode} icon={MapPin} />
            <ReadOnlyField label={t('country')} value={user.country} icon={Globe} />
          </div>
        </EditableSectionCard>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        <EditableSectionCard
          title={t('contact')}
          description={t('contactDescription')}
          canEdit={canEdit}
          onEdit={onEditSection ? () => onEditSection(3) : undefined}
        >
          <ContactVerifiedRow
            label={t('phoneNumber')}
            value={user.phoneNumber}
            verified={user.isPhoneVerified}
            canVerify={canEdit}
            onVerify={onVerifyPhone}
            verifyLabel={t('verifyPhone')}
          />
          <ReadOnlyField
            label={t('language')}
            value={
              user.locale === 'si'
                ? t('localeSinhala')
                : user.locale
                  ? t('localeEnglish')
                  : null
            }
            icon={Globe}
          />
        </EditableSectionCard>

        <EditableSectionCard
          title={t('name')}
          description={t('nameDescription')}
          canEdit={canEdit}
          onEdit={onEditSection ? () => onEditSection(4) : undefined}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField label={t('firstName')} value={user.firstName} icon={User} />
            <ReadOnlyField label={t('lastName')} value={user.lastName} icon={User} />
          </div>
          <ReadOnlyField label={t('displayName')} value={user.displayName} icon={User} />
        </EditableSectionCard>
      </div>
    </div>
  )
}
