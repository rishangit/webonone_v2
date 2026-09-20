import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { Body, Button, CustomDialog, Muted, TextField, useToast } from '@webonone/mobile-ui'
import { authApi } from '@/features/auth/authApi'
import { ApiError } from '@/shared/services/apiClient'

export type VerifyContactChannel = 'email' | 'phone'

const CHANNEL_CONFIG = {
  email: {
    title: 'Verify email',
    description: 'We will send a 6-digit code to your email address.',
    submitLabel: 'Verify email',
    otpLength: 6,
    countdownSeconds: 120,
    request: () => authApi.requestProfileEmailOtp(),
    verify: (otp: string) => authApi.verifyProfileEmailOtp(otp),
    verifiedToast: 'Email verified',
  },
  phone: {
    title: 'Verify phone',
    description: 'We will send a 6-digit code to your phone number.',
    submitLabel: 'Verify phone',
    otpLength: 6,
    countdownSeconds: 60,
    request: () => authApi.requestProfilePhoneOtp(),
    verify: (otp: string) => authApi.verifyProfilePhoneOtp(otp),
    verifiedToast: 'Phone verified',
  },
} as const

export function VerifyContactDialog({
  open,
  channel,
  contactHint,
  onOpenChange,
  onVerified,
}: {
  open: boolean
  channel: VerifyContactChannel
  contactHint: string
  onOpenChange: (open: boolean) => void
  onVerified: () => void
}) {
  const { toast } = useToast()
  const config = CHANNEL_CONFIG[channel]
  const sessionKeyRef = useRef<string | null>(null)

  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number>(config.countdownSeconds)

  const sendOtp = useCallback(async () => {
    setSending(true)
    setError(null)
    try {
      await config.request()
      setSecondsLeft(config.countdownSeconds)
      setLocked(false)
      setAttemptsRemaining(null)
      setOtp('')
      toast({ title: 'Verification code sent' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send code'
      setError(message)
      toast({ title: 'Could not send code', description: message, variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }, [config, toast])

  useEffect(() => {
    if (!open) {
      sessionKeyRef.current = null
      return
    }

    const sessionKey = channel
    if (sessionKeyRef.current === sessionKey) return
    sessionKeyRef.current = sessionKey
    setOtp('')
    setError(null)
    setAttemptsRemaining(null)
    setLocked(false)
    setLoading(false)
    setSecondsLeft(config.countdownSeconds)
    void sendOtp()
  }, [open, channel, config.countdownSeconds, sendOtp])

  useEffect(() => {
    if (!open || secondsLeft <= 0) return
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [open, secondsLeft])

  const expired = secondsLeft <= 0
  const disabled = loading || locked || expired || sending || otp.length !== config.otpLength

  async function handleVerify() {
    if (disabled) return

    setLoading(true)
    setError(null)
    try {
      await config.verify(otp)
      toast({ title: config.verifiedToast })
      onVerified()
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'OTP_MAX_ATTEMPTS') {
          setLocked(true)
          setAttemptsRemaining(0)
          setError('Too many attempts. Request a new code.')
        } else if (typeof err.attemptsRemaining === 'number') {
          setAttemptsRemaining(err.attemptsRemaining)
          setError(err.message)
        } else if (err.code === 'OTP_EXPIRED') {
          setSecondsLeft(0)
          setError('Code expired. Request a new one.')
        } else {
          setError(err.message)
        }
      } else {
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={config.title}
      description={config.description}
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <>
          <Button variant="outline" disabled={loading || sending} onPress={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={loading || sending} disabled={disabled} onPress={() => void handleVerify()}>
            {config.submitLabel}
          </Button>
        </>
      }
    >
      <View className="gap-3">
        <Muted>
          Enter the {config.otpLength}-digit code sent to {contactHint}.
        </Muted>
        {error ? <Body className="text-destructive">{error}</Body> : null}
        {!locked && !expired && attemptsRemaining !== null ? (
          <Muted>Attempts remaining: {attemptsRemaining}</Muted>
        ) : null}
        {!locked && !expired ? <Muted>Code expires in {secondsLeft}s</Muted> : null}
        {(expired || locked) && !sending ? (
          <Button variant="outline" onPress={() => void sendOtp()}>
            Request new code
          </Button>
        ) : null}
        <TextField
          label="Verification code"
          required
          value={otp}
          onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, config.otpLength))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          editable={!loading && !locked && !sending}
          placeholder={`${config.otpLength}-digit code`}
        />
      </View>
    </CustomDialog>
  )
}
