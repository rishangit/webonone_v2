import { useLayoutEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AuthLayout, Button } from '@webonone/mobile-ui'
import { AuthDivider } from './components/AuthDivider'
import { AuthLink } from './components/AuthLink'
import { GoogleSignInButton } from './components/GoogleSignInButton'
import { RegisterEmailStep } from './components/RegisterEmailStep'
import { RegisterPasswordStep } from './components/RegisterPasswordStep'
import { RegisterProfileStep } from './components/RegisterProfileStep'
import { RegisterVerifyOtpStep } from './components/RegisterVerifyOtpStep'
import type { RegisterProfileFormValues } from './schemas/authSchemas'
import { useSession } from './SessionContext'
import { isGoogleSignInAvailable } from './googleSignIn'
import { clearRegistrationWizardStorage } from './utils/authFlowStorage'

type RegisterStep = 1 | 2 | 3 | 4

export function RegisterScreen() {
  const { t } = useTranslation('auth')
  const router = useRouter()
  const { loginWithGoogle } = useSession()
  const [step, setStep] = useState<RegisterStep>(1)
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<RegisterProfileFormValues>({ firstName: '', lastName: '' })
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const showGoogle = isGoogleSignInAvailable()

  useLayoutEffect(() => {
    void clearRegistrationWizardStorage()
    setStep(1)
    setEmail('')
    setProfile({ firstName: '', lastName: '' })
    setRegistrationComplete(false)
    setGoogleError(null)
  }, [])

  const stepTitles: Record<RegisterStep, { title: string; description: string }> = {
    1: { title: t('step1Title'), description: t('step1Description') },
    2: { title: t('step2Title'), description: t('step2Description') },
    3: { title: t('step3Title'), description: t('step3Description') },
    4: { title: t('step4Title'), description: t('step4Description') },
  }

  const { title, description } = registrationComplete
    ? {
        title: t('registrationCompleteTitle'),
        description: t('registrationCompleteDescription'),
      }
    : stepTitles[step]

  async function handleGoogle() {
    setGoogleError(null)
    setGoogleSubmitting(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : t('googleSignInFailed'))
    } finally {
      setGoogleSubmitting(false)
    }
  }

  const footer = registrationComplete ? null : <AuthLink label={t('alreadyHaveAccount')} href="/login" />

  return (
    <AuthLayout title={title} description={description} footer={footer}>
      {registrationComplete ? (
        <View className="gap-4">
          <Alert>
            <AlertDescription>{t('registrationCompleteAlert')}</AlertDescription>
          </Alert>
          <Button className="w-full" onPress={() => router.replace('/login')}>
            {t('signIn')}
          </Button>
        </View>
      ) : (
        <View className="gap-4">
          {step === 1 ? (
            <>
              {showGoogle ? (
                <GoogleSignInButton loading={googleSubmitting} disabled={googleSubmitting} onPress={handleGoogle} />
              ) : null}
              {showGoogle ? <AuthDivider label={t('orRegisterWithEmail')} /> : null}
              {googleError ? (
                <Alert variant="destructive">
                  <AlertDescription>{googleError}</AlertDescription>
                </Alert>
              ) : null}
              <RegisterEmailStep
                onSuccess={(nextEmail) => {
                  setEmail(nextEmail)
                  setStep(2)
                }}
              />
            </>
          ) : null}
          {step === 2 ? (
            <RegisterVerifyOtpStep email={email} onSuccess={() => setStep(3)} onBack={() => setStep(1)} />
          ) : null}
          {step === 3 ? (
            <RegisterProfileStep
              initialValues={profile}
              onSuccess={(values) => {
                setProfile(values)
                setStep(4)
              }}
              onBack={() => setStep(2)}
            />
          ) : null}
          {step === 4 ? (
            <RegisterPasswordStep
              firstName={profile.firstName}
              lastName={profile.lastName}
              onBack={() => setStep(3)}
              onSuccess={() => setRegistrationComplete(true)}
            />
          ) : null}
        </View>
      )}
    </AuthLayout>
  )
}
