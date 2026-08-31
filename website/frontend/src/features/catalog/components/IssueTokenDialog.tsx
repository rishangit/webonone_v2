import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  ContactValueLine,
  CustomDialog,
  useToast,
} from '@webonone/ui-kit'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import { TokenWorkflowProgress } from '@/features/catalog/components/TokenWorkflowProgress'
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
  const { t } = useTranslation('search')
  const { t: tc } = useTranslation('common')
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
        setSubmitError(err.message || t('failedLoadToken'))
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
      toast({ title: t('tokenIssued'), description: t('yourTokenIs', { label: item.tokenLabel }) })
      onIssued?.(item)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedIssueToken')
      setSubmitError(message)
      toast({
        title: t('failedIssueToken'),
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
      title={t('issueToken')}
      description={existing ? t('alreadyHaveToken') : t('confirmBookToken')}
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
            {existing ? tc('close') : tc('cancel')}
          </Button>
          {!existing ? (
            <Button type="button" disabled={saving || loading} onClick={() => void handleIssue()}>
              <Save className="mr-2 h-4 w-4" aria-hidden />
              {saving ? t('issuing') : t('issueToken')}
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
            {existing ? t('yourToken') : t('tokenNumber')}
          </p>
          <p className="text-2xl font-semibold tracking-wide text-foreground">
            {existing ? existing.tokenLabel : loading ? '…' : tokenLabel}
          </p>
          {existing ? <TokenWorkflowProgress progress={existing.workflowProgress} /> : null}
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="truncate font-medium">{user.displayName}</p>
          <ContactValueLine kind="email" value={user.email} />
        </div>
      </div>
    </CustomDialog>
  )
}
