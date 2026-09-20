import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  Card,
  EditableSectionCard,
  FeatureScreen,
  ImagePreview,
  Muted,
  Spinner,
  StatusTag,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { authApi, type IdentityProfile } from '@/features/auth/authApi'
import { useSession } from '@/features/auth/SessionContext'
import { ProfileEditDialog } from '@/features/profile/ProfileEditDialog'
import type { ProfileWizardStep } from '@/features/profile/profileSchemas'
import { VerifyContactDialog } from '@/features/profile/VerifyContactDialog'
import type { AppLocale } from '@/shared/types'

function dash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function localeLabel(locale: string | null, english: string, sinhala: string): string {
  if (locale === 'si') return sinhala
  if (locale) return english
  return '—'
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Muted className="text-xs uppercase tracking-wide">{label}</Muted>
      <Body>{value}</Body>
    </View>
  )
}

export function ProfileScreen() {
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const { logout, refreshProfile, setLocale } = useSession()
  const [profile, setProfile] = useState<IdentityProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editStep, setEditStep] = useState<ProfileWizardStep | null>(null)
  const [verifyChannel, setVerifyChannel] = useState<'email' | 'phone' | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProfile(await authApi.fetchIdentityMe())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unableToLoad'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openWizard = useCallback((step: ProfileWizardStep) => {
    setEditStep(step)
  }, [])

  const handleSaved = useCallback(
    async (updated: IdentityProfile) => {
      setProfile(updated)
      await refreshProfile()
      if (updated.locale === 'en' || updated.locale === 'si') {
        await setLocale(updated.locale as AppLocale)
      }
    },
    [refreshProfile, setLocale],
  )

  const handleVerified = useCallback(async () => {
    await load()
    await refreshProfile()
  }, [load, refreshProfile])

  if (loading) {
    return (
      <FeatureScreen title={t('pageTitle')} description={t('pageDescription')}>
        <Spinner label={t('loading')} />
      </FeatureScreen>
    )
  }

  if (error || !profile) {
    return (
      <FeatureScreen title={t('pageTitle')} description={t('pageDescription')}>
        <Card className="gap-3">
          <Body className="text-destructive">{error ?? t('unableToLoad')}</Body>
          <Button onPress={() => void load()}>{tc('retry')}</Button>
        </Card>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen title={t('pageTitle')} description={t('pageDescription')}>
      <EditableSectionCard
        title={t('sections.account.title')}
        description={t('sections.account.description')}
        canEdit
        onEdit={() => openWizard(1)}
      >
        <View className="gap-4">
          <View className="self-center">
            <ImagePreview
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="h-40 w-40"
            />
          </View>
          <View className="w-full gap-3">
            <Body className="text-center text-xl font-semibold">{profile.displayName}</Body>
            <View className="gap-1">
              <Muted className="text-xs uppercase tracking-wide">{t('fields.email')}</Muted>
              <View className="flex-row flex-wrap items-center gap-2">
                <Body className="min-w-0 flex-1 text-sm">{dash(profile.email)}</Body>
                {profile.email?.trim() ? (
                  <StatusTag variant={profile.isEmailVerified ? 'verified' : 'unverified'} />
                ) : null}
              </View>
            </View>
            {!profile.isEmailVerified && profile.email ? (
              <Button variant="outline" size="sm" onPress={() => setVerifyChannel('email')}>
                {t('verify.email.button')}
              </Button>
            ) : null}
            {profile.isGoogleUser ? (
              <Muted className="text-xs">{t('wizard.signedInWithGoogle')}</Muted>
            ) : null}
            {profile.isGoogleUser ? (
              <Muted className="text-sm">{t('wizard.googleImportViewHint')}</Muted>
            ) : null}
          </View>
        </View>
      </EditableSectionCard>

      <EditableSectionCard
        title={t('sections.name.title')}
        description={t('sections.name.description')}
        canEdit
        onEdit={() => openWizard(4)}
      >
        <ProfileField label={t('fields.firstName')} value={dash(profile.firstName)} />
        <ProfileField label={t('fields.lastName')} value={dash(profile.lastName)} />
        <ProfileField label={t('fields.displayName')} value={dash(profile.displayName)} />
      </EditableSectionCard>

      <EditableSectionCard
        title={t('sections.contact.title')}
        description={t('sections.contact.description')}
        canEdit
        onEdit={() => openWizard(3)}
      >
        <ProfileField label={t('fields.phone')} value={dash(profile.phoneNumber)} />
        <ProfileField
          label={t('fields.locale')}
          value={localeLabel(profile.locale, tc('english'), tc('sinhala'))}
        />
        {!profile.isPhoneVerified && profile.phoneNumber ? (
          <Button variant="outline" size="sm" onPress={() => setVerifyChannel('phone')}>
            {t('verify.phone.button')}
          </Button>
        ) : null}
      </EditableSectionCard>

      <EditableSectionCard
        title={t('sections.address.title')}
        description={t('sections.address.description')}
        canEdit
        onEdit={() => openWizard(2)}
      >
        <ProfileField label={t('fields.addressLine1')} value={dash(profile.addressLine1)} />
        <ProfileField label={t('fields.addressLine2')} value={dash(profile.addressLine2)} />
        <ProfileField label={t('fields.city')} value={dash(profile.city)} />
        <ProfileField label={t('fields.stateRegion')} value={dash(profile.stateRegion)} />
        <ProfileField label={t('fields.postalCode')} value={dash(profile.postalCode)} />
        <ProfileField label={t('fields.country')} value={dash(profile.country)} />
      </EditableSectionCard>

      <Button variant="outline" onPress={() => void logout()}>
        {tc('logout')}
      </Button>

      {editStep !== null ? (
        <ProfileEditDialog
          open
          initialStep={editStep}
          profile={profile}
          onOpenChange={(open) => {
            if (!open) setEditStep(null)
          }}
          onSaved={(updated) => void handleSaved(updated)}
        />
      ) : null}

      {verifyChannel ? (
        <VerifyContactDialog
          open
          channel={verifyChannel}
          contactHint={
            verifyChannel === 'email'
              ? (profile.email?.trim() || 'your email')
              : (profile.phoneNumber?.trim() || 'your phone')
          }
          onOpenChange={(open) => {
            if (!open) setVerifyChannel(null)
          }}
          onVerified={() => void handleVerified()}
        />
      ) : null}
    </FeatureScreen>
  )
}
