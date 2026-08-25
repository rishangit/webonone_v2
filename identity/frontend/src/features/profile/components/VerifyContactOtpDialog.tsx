import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  Form,
  FormField,
  OtpInput,
  Spinner,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import { authApi, type AuthApiError } from '@/shared/services/authApi'
import type { UserProfile } from '@/shared/types/auth.types'

export type VerifyContactChannel = 'email' | 'phone'

const EMAIL_OTP_COUNTDOWN_SECONDS = 120
const PHONE_OTP_COUNTDOWN_SECONDS = 60

const DIALOG_SIZE = {
  sizeWidth: 'small' as const,
  sizeHeight: 'auto' as const,
}

function buildChannelConfig(t: TFunction<'profile'>) {
  return {
    email: {
      title: t('verify.email.title'),
      description: t('verify.email.description'),
      submitLabel: t('verify.email.submit'),
      otpLength: 6,
      countdownSeconds: EMAIL_OTP_COUNTDOWN_SECONDS,
      embedPath: '/embed/dialogs/profile/verify-email',
      formId: 'verify-email-otp-form',
      request: () => authApi.requestProfileEmailOtp(),
      verify: (otp: string) => authApi.verifyProfileEmailOtp({ otp }),
    },
    phone: {
      title: t('verify.phone.title'),
      description: t('verify.phone.description'),
      submitLabel: t('verify.phone.submit'),
      otpLength: 6,
      countdownSeconds: PHONE_OTP_COUNTDOWN_SECONDS,
      embedPath: '/embed/dialogs/profile/verify-phone',
      formId: 'verify-phone-otp-form',
      request: () => authApi.requestProfilePhoneOtp(),
      verify: (otp: string) => authApi.verifyProfilePhoneOtp({ otp }),
    },
  } as const
}

export type VerifyContactOtpDialogProps = {
  open: boolean
  channel: VerifyContactChannel
  contactHint: string
  onOpenChange: (open: boolean) => void
  onVerified: (user: UserProfile) => void
  chrome?: 'dialog' | 'embed-page'
}

export function VerifyContactOtpDialog({
  open,
  channel,
  contactHint,
  onOpenChange,
  onVerified,
  chrome = 'dialog',
}: VerifyContactOtpDialogProps) {
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const config = buildChannelConfig(t)[channel]
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number>(config.countdownSeconds)
  const sessionKeyRef = useRef<string | null>(null)

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: config.embedPath,
    title: config.title,
    description: config.description,
    submitLabel: config.submitLabel,
    cancelLabel: tc('cancel'),
    ...DIALOG_SIZE,
    onResult: (payload) => {
      if (payload && typeof payload === 'object' && 'user' in payload) {
        const user = (payload as { user: UserProfile }).user
        dispatch(authActions.profileUpdateSucceeded(user))
        onVerified(user)
      } else {
        dispatch(authActions.profileFetchRequested({ force: true }))
      }
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  const sendOtp = useCallback(async () => {
    setSending(true)
    setError(null)
    try {
      await config.request()
      setSecondsLeft(config.countdownSeconds)
      setLocked(false)
      setAttemptsRemaining(null)
      setOtp('')
      toast({ title: t('verify.codeSentToast') })
    } catch (err) {
      const apiErr = err as AuthApiError
      setError(apiErr.message ?? t('errors.sendCodeFailed'))
      toast({
        title: t('verify.couldNotSendToast'),
        description: apiErr.message,
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }, [config, t, toast])

  useEffect(() => {
    if (!open || isHosted) {
      sessionKeyRef.current = null
      return
    }

    const sessionKey = `${channel}:${chrome}`
    if (sessionKeyRef.current === sessionKey) {
      return
    }
    sessionKeyRef.current = sessionKey
    setOtp('')
    setError(null)
    setAttemptsRemaining(null)
    setLocked(false)
    setLoading(false)
    setSecondsLeft(config.countdownSeconds)
    void sendOtp()
  }, [open, isHosted, channel, chrome, sendOtp])

  useEffect(() => {
    if (!open || isHosted || secondsLeft <= 0) return
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [open, isHosted, secondsLeft])

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, loading || sending, config.submitLabel, {
      description: config.description,
      secondaryLabel: null,
    })
  }, [
    chrome,
    parentOrigin,
    dialogRequestId,
    loading,
    sending,
    config.description,
    config.submitLabel,
  ])

  const expired = secondsLeft <= 0
  const disabled = loading || locked || expired || sending || otp.length !== config.otpLength

  const handleVerify = useCallback(async () => {
    if (loading || locked || sending || otp.length !== config.otpLength) return

    setLoading(true)
    setError(null)
    try {
      const result = await config.verify(otp)
      dispatch(authActions.profileUpdateSucceeded(result.user))
      toast({ title: channel === 'email' ? t('verify.emailVerifiedToast') : t('verify.phoneVerifiedToast') })
      if (chrome === 'embed-page' && parentOrigin && dialogRequestId) {
        sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId, { user: result.user })
      } else {
        onVerified(result.user)
        onOpenChange(false)
      }
    } catch (err) {
      const apiErr = err as AuthApiError
      if (apiErr.code === 'OTP_MAX_ATTEMPTS') {
        setLocked(true)
        setAttemptsRemaining(0)
        setError(t('errors.tooManyAttempts'))
      } else if (typeof apiErr.attemptsRemaining === 'number') {
        setAttemptsRemaining(apiErr.attemptsRemaining)
        setError(apiErr.message)
      } else if (apiErr.code === 'OTP_EXPIRED') {
        setSecondsLeft(0)
        setError(t('errors.codeExpiredRequestNew'))
      } else {
        setError(apiErr.message ?? t('errors.verificationFailed'))
      }
    } finally {
      setLoading(false)
    }
  }, [
    loading,
    locked,
    sending,
    otp,
    config,
    dispatch,
    t,
    toast,
    channel,
    chrome,
    parentOrigin,
    dialogRequestId,
    onVerified,
    onOpenChange,
  ])

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      void handleVerify()
    },
  })

  if (isHosted) {
    return null
  }

  const body = (
    <Form
      id={config.formId}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        void handleVerify()
      }}
    >
      <p className="text-sm text-muted-foreground">
        {t('verify.codeSentTo', { length: config.otpLength, contact: contactHint })}
      </p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!locked && !expired && attemptsRemaining !== null ? (
        <p className="text-sm text-muted-foreground">
          {t('verify.attemptsRemaining', { count: attemptsRemaining })}
        </p>
      ) : null}
      {!locked && !expired ? (
        <p className="text-sm text-muted-foreground">{t('verify.codeExpiresIn', { seconds: secondsLeft })}</p>
      ) : null}
      {(expired || locked) && !sending ? (
        <Alert>
          <AlertDescription>
            {locked ? `${t('verify.tooManyAttemptsShort')} ` : `${t('verify.codeExpired')} `}
            <button type="button" className="underline" onClick={() => void sendOtp()}>
              {t('verify.requestNewCode')}
            </button>
          </AlertDescription>
        </Alert>
      ) : null}
      <FormField
        label={t('verify.otpLabel', { length: config.otpLength })}
        htmlFor={`verify-${channel}-otp`}
        required
        className="text-center"
      >
        <OtpInput
          id={`verify-${channel}-otp`}
          length={config.otpLength}
          value={otp}
          disabled={loading || locked || sending}
          autoFocus
          className="justify-center"
          onChange={setOtp}
        />
      </FormField>
    </Form>
  )

  if (chrome === 'embed-page') {
    return <div className="p-1">{body}</div>
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={config.title}
      description={config.description}
      {...DIALOG_SIZE}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="submit" form={config.formId} disabled={disabled}>
            {loading || sending ? <Spinner size="sm" /> : config.submitLabel}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
