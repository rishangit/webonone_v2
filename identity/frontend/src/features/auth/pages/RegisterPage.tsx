import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, AuthLayout, Button } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { RegisterEmailStep } from '../components/RegisterEmailStep'
import { RegisterPasswordStep } from '../components/RegisterPasswordStep'
import { RegisterProfileStep } from '../components/RegisterProfileStep'
import { RegisterVerifyOtpStep } from '../components/RegisterVerifyOtpStep'
import type { RegisterProfileFormValues } from '../schemas/authSchemas'
import { useRedirectMode } from '../hooks/useRedirectMode'
import { completeAuthRedirect } from '../utils/completeAuthRedirect'
import { clearRegistrationWizardStorage } from '../utils/resetRegistrationWizard'
import { authActions } from '../store'
import { withRedirectQuery } from '../utils/redirectQuery'

type RegisterStep = 1 | 2 | 3 | 4

const STEP_TITLES: Record<RegisterStep, { title: string; description: string }> = {
  1: {
    title: 'Create account',
    description: 'Enter your email to receive a verification code',
  },
  2: {
    title: 'Verify your email',
    description: 'Enter the 4-digit code we sent you',
  },
  3: {
    title: 'Personal information',
    description: 'Tell us your name',
  },
  4: {
    title: 'Set your password',
    description: 'Choose a secure password for your account',
  },
}

export function RegisterPage() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { isRedirect, redirectUri, state } = useRedirectMode()
  const { registrationComplete, accessToken, user, isLoading, error } = useAppSelector((s) => s.auth)
  const handledRef = useRef(false)
  const loginLink = withRedirectQuery('/login', searchParams)

  const [step, setStep] = useState<RegisterStep>(1)
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<RegisterProfileFormValues>({ firstName: '', lastName: '' })

  useLayoutEffect(() => {
    clearRegistrationWizardStorage()
    dispatch(authActions.resetRegistrationFlow())
    setStep(1)
    setEmail('')
    setProfile({ firstName: '', lastName: '' })
  }, [dispatch])

  useEffect(() => {
    if (handledRef.current || isLoading || !accessToken || !user) return

    if (isRedirect && redirectUri && state) {
      handledRef.current = true
      completeAuthRedirect(accessToken, redirectUri, state).catch(() => {
        handledRef.current = false
      })
    }
  }, [accessToken, user, isLoading, isRedirect, redirectUri, state])

  const { title, description } = registrationComplete
    ? {
        title: 'Welcome to WebOnOne',
        description: 'Your account has been created successfully',
      }
    : STEP_TITLES[step]

  return (
    <AuthLayout
      title={title}
      description={description}
      variant="minimal"
      footer={
        registrationComplete ? null : (
          <Link to={loginLink} className="text-primary underline-offset-4 hover:underline">
            Already have an account? Sign in
          </Link>
        )
      }
    >
      {registrationComplete ? (
        <div className="space-y-6">
          <Alert>
            <AlertDescription>Welcome to WebOnOne. You can sign in now.</AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link to={loginLink}>Sign in</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {step === 1 ? (
            <>
              <GoogleSignInButton />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
                </div>
              </div>
              <RegisterEmailStep
                onSuccess={(nextEmail) => {
                  setEmail(nextEmail)
                  setStep(2)
                }}
              />
            </>
          ) : null}
          {step === 2 ? (
            <RegisterVerifyOtpStep
              email={email}
              onSuccess={() => setStep(3)}
              onBack={() => setStep(1)}
            />
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
            />
          ) : null}
        </div>
      )}
      {!isRedirect && accessToken && user ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Signed in as {user.displayName}
        </p>
      ) : null}
      {error && step === 1 ? <p className="mt-2 text-center text-sm text-destructive">{error}</p> : null}
    </AuthLayout>
  )
}
