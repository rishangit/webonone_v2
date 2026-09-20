import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  EditableSectionCard,
  ImagePreview,
  Muted,
  ReadOnlyField,
  StatusTag,
  getPhoneCountryByIso2,
  isStatusTagVariant,
} from '@webonone/mobile-ui'
import type { IdentityUserDetail } from '@/features/users/types/users.types'

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function dash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function formatCountryName(iso2: string | null | undefined): string {
  const code = iso2?.trim()
  if (!code) return '—'
  return getPhoneCountryByIso2(code)?.name ?? code
}

function localeLabel(
  locale: string | null,
  english: string,
  sinhala: string,
): string {
  if (locale === 'si') return sinhala
  if (locale) return english
  return '—'
}

function ContactVerifiedField({
  label,
  value,
  verified,
}: {
  label: string
  value: string | null | undefined
  verified: boolean
}) {
  const display = dash(value)

  return (
    <View className="gap-1">
      <Muted className="text-xs uppercase tracking-wide">{label}</Muted>
      <View className="flex-row flex-wrap items-center gap-2">
        <Body className="min-w-0 flex-1 text-sm">{display}</Body>
        {value?.trim() ? (
          <StatusTag variant={verified ? 'verified' : 'unverified'} />
        ) : null}
      </View>
    </View>
  )
}

type UserOverviewViewProps = {
  user: IdentityUserDetail
}

export function UserOverviewView({ user }: UserOverviewViewProps) {
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const { t: tu } = useTranslation('users')

  return (
    <View className="gap-6">
      <EditableSectionCard
        title={t('sections.account.title')}
        description={t('sections.account.description')}
        canEdit={false}
      >
        <View className="gap-4">
          <View className="self-center">
            <ImagePreview
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-40 w-40"
            />
          </View>
          <View className="w-full gap-3">
            <Body className="text-center text-xl font-semibold">{user.displayName}</Body>
            {user.role ? (
              <View className="gap-1">
                <Muted className="text-xs uppercase tracking-wide">{tu('roles.label')}</Muted>
                <View className="flex-row justify-start">
                  {isStatusTagVariant(user.role) ? (
                    <StatusTag variant={user.role} />
                  ) : (
                    <StatusTag variant="member">{formatRoleLabel(user.role)}</StatusTag>
                  )}
                </View>
              </View>
            ) : null}
            <ContactVerifiedField
              label={t('fields.email')}
              value={user.email}
              verified={user.isEmailVerified}
            />
            {user.isGoogleUser ? (
              <Muted className="text-xs">{t('wizard.signedInWithGoogle')}</Muted>
            ) : null}
            {user.isGoogleUser ? (
              <Muted className="text-sm">{t('wizard.googleImportViewHint')}</Muted>
            ) : null}
          </View>
        </View>
      </EditableSectionCard>

      <EditableSectionCard
        title={t('sections.address.title')}
        description={t('sections.address.description')}
        canEdit={false}
      >
        <ReadOnlyField label={t('fields.addressLine1')} value={dash(user.addressLine1)} />
        <ReadOnlyField label={t('fields.addressLine2')} value={dash(user.addressLine2)} />
        <ReadOnlyField label={t('fields.city')} value={dash(user.city)} />
        <ReadOnlyField label={t('fields.stateRegion')} value={dash(user.stateRegion)} />
        <ReadOnlyField label={t('fields.postalCode')} value={dash(user.postalCode)} />
        <ReadOnlyField label={t('fields.country')} value={formatCountryName(user.country)} />
      </EditableSectionCard>

      <EditableSectionCard
        title={t('sections.contact.title')}
        description={t('sections.contact.description')}
        canEdit={false}
      >
        <ContactVerifiedField
          label={t('fields.phoneNumber')}
          value={user.phoneNumber}
          verified={user.isPhoneVerified}
        />
        <ReadOnlyField
          label={tc('language')}
          value={localeLabel(user.locale, tc('english'), tc('sinhala'))}
        />
      </EditableSectionCard>

      <EditableSectionCard
        title={t('sections.name.title')}
        description={t('sections.name.description')}
        canEdit={false}
      >
        <ReadOnlyField label={t('fields.firstName')} value={dash(user.firstName)} />
        <ReadOnlyField label={t('fields.lastName')} value={dash(user.lastName)} />
        <ReadOnlyField label={t('fields.displayName')} value={dash(user.displayName)} />
      </EditableSectionCard>
    </View>
  )
}
