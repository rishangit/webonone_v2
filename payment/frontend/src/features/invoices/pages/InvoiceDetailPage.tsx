import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Copy, ExternalLink, FileText, Upload } from 'lucide-react'
import type { MediaItemDto } from '@webonone/media-embed'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
  ImagePreview,
  StatusTag,
  useToast,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { ReceiptUploadModal } from '@/features/invoices/components/ReceiptUploadModal'
import { paymentApi } from '@/shared/services/paymentApi'
import type { InvoiceDetail, InvoiceStatus } from '@/shared/types/payment.types'
import { formatDate, formatLkr, formatPeriod } from '@/shared/utils/money'
import { copyTextToClipboard } from '@/shared/utils/copyText'

function isReceiptImage(fileName: string | null, url: string | null): boolean {
  const candidate = `${fileName ?? ''} ${url ?? ''}`
  return /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i.test(candidate)
}

function statusVariant(status: InvoiceStatus): 'pending' | 'approved' | 'rejected' {
  if (status === 'paid') return 'approved'
  if (status === 'overdue' || status === 'void') return 'rejected'
  return 'pending'
}

function statusLabelKey(status: InvoiceStatus): string {
  switch (status) {
    case 'issued':
      return 'statusIssued'
    case 'paid':
      return 'statusPaid'
    case 'overdue':
      return 'statusOverdue'
    case 'void':
      return 'statusVoid'
    case 'pending_verification':
      return 'statusPendingReview'
    default:
      return status
  }
}

export function InvoiceDetailPage() {
  const { t } = useTranslation('invoices')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const role = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  usePlatformLoading(loading ? t('loadingInvoice') : null)

  async function load() {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await paymentApi.getInvoice(id)
      setInvoice(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when id changes
  }, [id])

  async function markPaid() {
    if (!id) return
    setError(null)
    try {
      const data = await paymentApi.markPaid(id)
      setInvoice(data)
      toast({ title: t('markedPaid') })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedMarkPaid')
      setError(message)
      toast({ title: t('failedMarkPaid'), description: message, variant: 'destructive' })
    }
  }

  async function voidInvoice() {
    if (!id) return
    setError(null)
    try {
      const data = await paymentApi.voidInvoice(id)
      setInvoice(data)
      toast({ title: t('voided') })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedVoid')
      setError(message)
      toast({ title: t('failedVoid'), description: message, variant: 'destructive' })
    }
  }

  async function rejectProof() {
    if (!id) return
    setError(null)
    try {
      const data = await paymentApi.rejectPaymentProof(id)
      setInvoice(data)
      toast({ title: t('proofRejected') })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedRejectProof')
      setError(message)
      toast({ title: t('failedRejectProof'), description: message, variant: 'destructive' })
    }
  }

  async function submitProof(items: MediaItemDto[]) {
    if (!id || items.length === 0) return
    const item = items[0]
    setSubmitting(true)
    setError(null)
    try {
      const data = await paymentApi.submitPaymentProof(id, {
        mediaId: item.id,
        url: item.url,
        fileName: item.fileName,
      })
      setInvoice(data)
      toast({ title: t('proofSubmitted') })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('failedSubmitProof')
      setError(message)
      toast({
        title: t('failedSubmitProof'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function copyReference() {
    if (!invoice?.paymentReference) return
    setError(null)
    try {
      await copyTextToClipboard(invoice.paymentReference)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('couldNotCopy'))
    }
  }

  const canSubmitProof =
    role === 'company_admin' &&
    invoice &&
    (invoice.status === 'issued' || invoice.status === 'overdue')

  const canMarkPaid =
    role === 'super_admin' &&
    invoice &&
    (invoice.status === 'issued' ||
      invoice.status === 'overdue' ||
      invoice.status === 'pending_verification')

  return (
    <FeaturePage
      title={invoice?.invoiceNumber ?? t('singular')}
      description={invoice ? invoice.companyName : undefined}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {tc('back')}
          </Button>
          {role === 'super_admin' && invoice ? (
            <>
              {invoice.status === 'pending_verification' ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void rejectProof()}>
                  {t('rejectProof')}
                </Button>
              ) : null}
              {canMarkPaid ? (
                <Button type="button" size="sm" onClick={() => void markPaid()}>
                  {t('markPaid')}
                </Button>
              ) : null}
              {invoice.status !== 'paid' && invoice.status !== 'void' ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void voidInvoice()}>
                  {t('voidAction')}
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      }
    >
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {invoice ? (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg">{t('summary')}</CardTitle>
                <StatusTag variant={statusVariant(invoice.status)}>
                  {t(statusLabelKey(invoice.status))}
                </StatusTag>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">{t('company')}: </span>
                  {invoice.companyName}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('amount')}: </span>
                  {formatLkr(invoice.amountMinor)}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('period')}: </span>
                  {formatPeriod(invoice.periodStart, invoice.periodEnd)}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('issuedLabel')}: </span>
                  {formatDate(invoice.issuedAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('due')}: </span>
                  {formatDate(invoice.dueAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('paidLabel')}: </span>
                  {invoice.paidAt ? formatDate(invoice.paidAt) : '—'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('lineItems')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {invoice.lines.map((line) => (
                  <div key={line.id} className="flex items-center justify-between gap-4 text-sm">
                    <span>{line.description}</span>
                    <span className="font-medium">{formatLkr(line.amountMinor)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-2 font-semibold">
                  <span>{t('total')}</span>
                  <span>{formatLkr(invoice.amountMinor)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('referenceTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-lg font-semibold tracking-wide">
                    {invoice.paymentReference}
                  </p>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => void copyReference()}
                    aria-label={copied ? t('referenceCopied') : t('copyReference')}
                    title={copied ? t('copied') : tc('copy')}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{t('referenceHint')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('receipt')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-start gap-4">
                  {invoice.receiptUrl &&
                  isReceiptImage(invoice.receiptFileName, invoice.receiptUrl) ? (
                    <a
                      href={invoice.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t('openReceipt')}
                    >
                      <ImagePreview
                        src={invoice.receiptUrl}
                        alt={invoice.receiptFileName ?? t('receipt')}
                        mode="view"
                        className="h-48 w-48"
                      />
                    </a>
                  ) : invoice.receiptUrl ? (
                    <a
                      href={invoice.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted p-4 text-center outline-none hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <FileText className="h-10 w-10 text-muted-foreground" aria-hidden />
                      <span className="line-clamp-3 text-xs text-muted-foreground">
                        {invoice.receiptFileName ?? t('document')}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                        <ExternalLink className="h-3 w-3" aria-hidden />
                        {tc('open')}
                      </span>
                    </a>
                  ) : (
                    <ImagePreview
                      src={null}
                      alt={t('receipt')}
                      mode={canSubmitProof ? 'edit' : 'view'}
                      onEdit={
                        canSubmitProof && !submitting
                          ? () => {
                              setUploadKey((k) => k + 1)
                              setUploadOpen(true)
                            }
                          : undefined
                      }
                      className="h-48 w-48"
                    />
                  )}

                  {canSubmitProof ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={submitting}
                        onClick={() => {
                          setUploadKey((k) => k + 1)
                          setUploadOpen(true)
                        }}
                      >
                        <Upload className="h-4 w-4" aria-hidden />
                        {t('uploadDocument')}
                      </Button>
                      <p className="max-w-[14rem] text-sm text-muted-foreground">{t('uploadHint')}</p>
                    </div>
                  ) : null}
                </div>

                {invoice.receiptUrl ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">{t('file')}: </span>
                      {invoice.receiptFileName ?? t('receiptFallback')}
                    </p>
                    {invoice.receiptUploadedAt ? (
                      <p>
                        <span className="text-muted-foreground">{t('uploaded')}: </span>
                        {formatDate(invoice.receiptUploadedAt)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {invoice && canSubmitProof ? (
        <ReceiptUploadModal
          isOpen={uploadOpen}
          accessToken={accessToken}
          companyId={invoice.companyId}
          invoiceId={invoice.id}
          openKey={uploadKey}
          onClose={() => setUploadOpen(false)}
          onSelect={(items) => {
            void submitProof(items)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}
