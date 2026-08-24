import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  useToast,
} from '@webonone/ui-kit'
import { companyCatalogApi } from '../services/companyCatalogApi'
import { TokenWorkflowProgress } from '@/features/calendar/components/TokenWorkflowProgress'
import type { CatalogSessionTokenItem } from '../types/companyCatalog.types'
import type { UserProfile } from '@/features/auth/types/auth.types'

const OUTLINE_FOOTER =
  'h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent'

export type MemberIssueTokenDialogProps = {
  open: boolean
  companyId: string
  serviceId: string
  eventId: string
  occurrenceDate: string
  user: UserProfile
  onOpenChange: (open: boolean) => void
  onIssued?: (token: CatalogSessionTokenItem) => void
}

export function MemberIssueTokenDialog({
  open,
  companyId,
  serviceId,
  eventId,
  occurrenceDate,
  user,
  onOpenChange,
  onIssued,
}: MemberIssueTokenDialogProps) {
  const { toast } = useToast()
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const [tokenLabel, setTokenLabel] = useState('…')
  const [existing, setExisting] = useState<CatalogSessionTokenItem | null>(null)
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
      companyCatalogApi.getNextToken(companyId, serviceId, eventId, occurrenceDate),
      companyCatalogApi.getMyToken(companyId, serviceId, eventId, occurrenceDate),
    ])
      .then(([next, mine]) => {
        if (cancelled) return
        setTokenLabel(next.tokenLabel)
        setExisting(mine)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setSubmitError(err.message || t('detail.sessions.failedLoadToken'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, companyId, serviceId, eventId, occurrenceDate, t])

  async function handleIssue() {
    if (existing) {
      onOpenChange(false)
      return
    }
    setSaving(true)
    setSubmitError(null)
    try {
      const item = await companyCatalogApi.bookToken(
        companyId,
        serviceId,
        eventId,
        occurrenceDate,
        {
          user_display_name: user.displayName,
          user_email: user.email ?? null,
        },
      )
      toast({
        title: t('detail.sessions.tokenIssued'),
        description: t('detail.sessions.yourTokenIs', { label: item.tokenLabel }),
      })
      onIssued?.(item)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('detail.sessions.failedIssueToken')
      setSubmitError(message)
      toast({
        title: t('detail.sessions.failedIssueToken'),
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
      title={t('detail.sessions.getToken')}
      description={
        existing ? t('detail.sessions.alreadyHaveToken') : t('detail.sessions.confirmBookToken')
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
            {existing ? tc('close') : tc('cancel')}
          </Button>
          {!existing ? (
            <Button type="button" disabled={saving || loading} onClick={() => void handleIssue()}>
              <Save className="mr-2 h-4 w-4" aria-hidden />
              {saving ? t('detail.sessions.issuing') : t('detail.sessions.getToken')}
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
            {existing ? t('detail.sessions.yourToken') : t('detail.sessions.tokenNumber')}
          </p>
          <p className="text-2xl font-semibold tracking-wide text-foreground">
            {existing ? existing.tokenLabel : loading ? '…' : tokenLabel}
          </p>
          {existing ? <TokenWorkflowProgress progress={existing.workflowProgress} /> : null}
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="truncate font-medium">{user.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </CustomDialog>
  )
}
