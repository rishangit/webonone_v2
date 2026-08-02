import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  useToast,
} from '@webonone/ui-kit'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import type { SessionTokenItem } from '@/features/catalog/types/catalog.types'
import type { WebsiteUser } from '@/features/auth/types/auth.types'

const OUTLINE_FOOTER =
  'h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent'

export type IssueTokenDialogProps = {
  open: boolean
  serviceId: string
  eventId: string
  occurrenceDate: string
  accessToken: string
  user: WebsiteUser
  onOpenChange: (open: boolean) => void
  onIssued?: (token: SessionTokenItem) => void
}

export function IssueTokenDialog({
  open,
  serviceId,
  eventId,
  occurrenceDate,
  accessToken,
  user,
  onOpenChange,
  onIssued,
}: IssueTokenDialogProps) {
  const { toast } = useToast()
  const [tokenLabel, setTokenLabel] = useState('…')
  const [existing, setExisting] = useState<SessionTokenItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setSubmitError(null)
    setExisting(null)
    setTokenLabel('…')
    setLoading(true)

    void Promise.all([
      catalogApi.getNextToken(serviceId, eventId, occurrenceDate, accessToken),
      catalogApi.getMyToken(serviceId, eventId, occurrenceDate, accessToken),
    ])
      .then(([next, mine]) => {
        if (cancelled) return
        setTokenLabel(next.tokenLabel)
        setExisting(mine)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setSubmitError(err.message || 'Failed to load token info')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, serviceId, eventId, occurrenceDate, accessToken])

  async function handleIssue() {
    if (existing) {
      onOpenChange(false)
      return
    }
    setSaving(true)
    setSubmitError(null)
    try {
      const item = await catalogApi.bookToken(
        serviceId,
        eventId,
        occurrenceDate,
        accessToken,
        {
          user_display_name: user.displayName,
          user_email: user.email ?? null,
        },
      )
      toast({ title: 'Token issued', description: `Your token is ${item.tokenLabel}` })
      onIssued?.(item)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to issue token'
      setSubmitError(message)
      toast({
        title: 'Failed to issue token',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Issue token"
      description={
        existing
          ? 'You already have a token for this session.'
          : 'Confirm to book the next queue token for your account.'
      }
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className={OUTLINE_FOOTER}
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {existing ? 'Close' : 'Cancel'}
          </Button>
          {!existing ? (
            <Button type="button" disabled={saving || loading} onClick={() => void handleIssue()}>
              <Save className="mr-2 h-4 w-4" aria-hidden />
              {saving ? 'Issuing…' : 'Issue token'}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4">
        {submitError ? (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {existing ? 'Your token' : 'Token number'}
          </p>
          <p className="text-2xl font-semibold tracking-wide text-foreground">
            {existing ? existing.tokenLabel : loading ? '…' : tokenLabel}
          </p>
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="truncate font-medium">{user.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </CustomDialog>
  )
}
