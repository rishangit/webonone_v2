import { useCallback, useState } from 'react'
import * as Clipboard from 'expo-clipboard'
import * as DocumentPicker from 'expo-document-picker'
import { Linking, Pressable, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Check, Copy, ExternalLink, FileText } from 'lucide-react-native'
import {
  Body,
  Button,
  Card,
  FeatureScreen,
  ImagePreview,
  Muted,
  ReadOnlyField,
  Spinner,
  StatusTag,
  Subheading,
  useToast,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { paymentApi } from '@/features/payment/services/paymentApi'
import { uploadReceiptFile } from '@/features/payment/services/mediaApi'
import type { InvoiceDetail, InvoiceStatus } from '@/features/payment/types/payment.types'
import {
  formatInvoiceDate,
  formatInvoicePeriod,
  formatLkr,
} from '@/features/payment/utils/formatInvoiceMoney'
import { invoiceStatusLabel, invoiceStatusVariant } from '@/features/payment/utils/invoiceStatus'

function isReceiptImage(fileName: string | null, url: string | null): boolean {
  const candidate = `${fileName ?? ''} ${url ?? ''}`
  return /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i.test(candidate)
}

function invoiceAllowsProofSubmission(status: InvoiceStatus): boolean {
  return status === 'issued' || status === 'overdue'
}

function canMarkPaid(status: InvoiceStatus): boolean {
  return status === 'issued' || status === 'overdue' || status === 'pending_verification'
}

export function InvoiceDetailScreen({ invoiceId }: { invoiceId: string }) {
  const { t } = useTranslation('invoices')
  const router = useRouter()
  const { user } = useSession()
  const { toast } = useToast()
  const isSuperAdmin = user?.role === 'super_admin'
  const isCompanyAdmin = user?.role === 'company_admin'

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setInvoice(await paymentApi.getInvoice(invoiceId))
    } catch (err) {
      setInvoice(null)
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  async function handleMarkPaid() {
    try {
      const data = await paymentApi.markPaid(invoiceId)
      setInvoice(data)
      toast({ title: 'Invoice marked paid' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark paid'
      setError(message)
      toast({ title: 'Failed to mark paid', description: message, variant: 'destructive' })
    }
  }

  async function handleVoid() {
    try {
      const data = await paymentApi.voidInvoice(invoiceId)
      setInvoice(data)
      toast({ title: 'Invoice voided' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to void invoice'
      setError(message)
      toast({ title: 'Failed to void invoice', description: message, variant: 'destructive' })
    }
  }

  async function handleRejectProof() {
    try {
      const data = await paymentApi.rejectPaymentProof(invoiceId)
      setInvoice(data)
      toast({ title: 'Payment proof rejected' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject proof'
      setError(message)
      toast({ title: 'Failed to reject proof', description: message, variant: 'destructive' })
    }
  }

  async function handleCopyReference() {
    if (!invoice?.paymentReference) return
    try {
      await Clipboard.setStringAsync(invoice.paymentReference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy reference')
    }
  }

  async function handleUploadReceipt() {
    if (!invoice) return
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (result.canceled || !result.assets?.[0]) return

      const asset = result.assets[0]
      setSubmitting(true)
      setError(null)

      const uploaded = await uploadReceiptFile({
        uri: asset.uri,
        fileName: asset.name ?? 'receipt',
        mimeType: asset.mimeType ?? 'application/octet-stream',
        companyId: invoice.companyId,
        invoiceId: invoice.id,
      })

      const data = await paymentApi.submitPaymentProof(invoice.id, {
        mediaId: uploaded.id,
        url: uploaded.url,
        fileName: uploaded.fileName,
      })
      setInvoice(data)
      toast({ title: 'Payment proof submitted' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit payment proof'
      setError(message)
      toast({ title: 'Failed to submit payment proof', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const showProofUpload =
    isCompanyAdmin && invoice && invoiceAllowsProofSubmission(invoice.status) && !submitting

  if (loading) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Spinner label="Loading invoice…" />
      </FeatureScreen>
    )
  }

  if (!invoice) {
    return (
      <FeatureScreen title={t('singular')} onBack={() => router.back()}>
        <Body className="text-destructive">{error ?? 'Invoice not found.'}</Body>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={invoice.invoiceNumber}
      description={invoice.companyName}
      onBack={() => router.back()}
      actions={
        isSuperAdmin ? (
          <View className="flex-row flex-wrap gap-2">
            {invoice.status === 'pending_verification' ? (
              <Button size="sm" variant="outline" onPress={() => void handleRejectProof()}>
                Reject proof
              </Button>
            ) : null}
            {canMarkPaid(invoice.status) ? (
              <Button size="sm" onPress={() => void handleMarkPaid()}>Mark paid</Button>
            ) : null}
            {invoice.status !== 'paid' && invoice.status !== 'void' ? (
              <Button size="sm" variant="outline" onPress={() => void handleVoid()}>
                Void
              </Button>
            ) : null}
          </View>
        ) : undefined
      }
    >
      {error ? <Body className="text-destructive">{error}</Body> : null}

      <Card className="gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <Subheading>Summary</Subheading>
          <StatusTag variant={invoiceStatusVariant(invoice.status)}>
            {invoiceStatusLabel(invoice.status)}
          </StatusTag>
        </View>
        <ReadOnlyField label="Company" value={invoice.companyName} />
        <ReadOnlyField label="Amount" value={formatLkr(invoice.amountMinor)} />
        <ReadOnlyField label="Period" value={formatInvoicePeriod(invoice.periodStart, invoice.periodEnd)} />
        <ReadOnlyField label="Issued" value={formatInvoiceDate(invoice.issuedAt)} />
        <ReadOnlyField label="Due" value={formatInvoiceDate(invoice.dueAt)} />
        <ReadOnlyField label="Paid" value={invoice.paidAt ? formatInvoiceDate(invoice.paidAt) : '—'} />
      </Card>

      <Card className="gap-3">
        <Subheading>Line items</Subheading>
        {invoice.lines.map((line) => (
          <View key={line.id} className="flex-row items-center justify-between gap-3">
            <Body className="flex-1">{line.description}</Body>
            <Body className="font-semibold">{formatLkr(line.amountMinor)}</Body>
          </View>
        ))}
        <View className="flex-row items-center justify-between border-t border-border pt-3">
          <Body className="font-semibold">Total</Body>
          <Body className="font-semibold">{formatLkr(invoice.amountMinor)}</Body>
        </View>
      </Card>

      <Card className="gap-3">
        <Subheading>Invoice reference number</Subheading>
        <View className="flex-row flex-wrap items-center gap-2">
          <Body className="font-mono text-lg font-semibold">{invoice.paymentReference}</Body>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Reference copied' : 'Copy invoice reference number'}
            onPress={() => void handleCopyReference()}
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </Pressable>
        </View>
        <Muted>
          Include this reference in the transfer description so payment can be matched to this invoice.
        </Muted>
      </Card>

      <Card className="gap-3">
        <Subheading>Invoice receipt</Subheading>
        <View className="flex-row flex-wrap items-start gap-4">
          {invoice.receiptUrl && isReceiptImage(invoice.receiptFileName, invoice.receiptUrl) ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open invoice receipt"
              onPress={() => void Linking.openURL(invoice.receiptUrl!)}
            >
              <ImagePreview
                src={invoice.receiptUrl}
                alt={invoice.receiptFileName ?? 'Receipt'}
                className="h-48 w-48 rounded-lg"
              />
            </Pressable>
          ) : invoice.receiptUrl ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void Linking.openURL(invoice.receiptUrl!)}
              className="h-48 w-48 items-center justify-center gap-2 rounded-lg border border-border bg-muted p-4"
            >
              <FileText size={40} />
              <Muted className="text-center text-xs">
                {invoice.receiptFileName ?? 'Document'}
              </Muted>
              <View className="flex-row items-center gap-1">
                <ExternalLink size={12} />
                <Body className="text-xs font-medium">Open</Body>
              </View>
            </Pressable>
          ) : (
            <ImagePreview
              src={null}
              alt="Receipt"
              className="h-48 w-48 rounded-lg"
            />
          )}

          {showProofUpload ? (
            <View className="min-w-0 flex-1 gap-2">
              <Button size="sm" disabled={submitting} onPress={() => void handleUploadReceipt()}>
                Upload document
              </Button>
              <Muted>Upload your invoice receipt (PDF or image) to submit for review.</Muted>
            </View>
          ) : null}
        </View>

        {invoice.receiptUrl ? (
          <View className="gap-1">
            <ReadOnlyField
              label="File"
              value={invoice.receiptFileName ?? 'Receipt'}
            />
            {invoice.receiptUploadedAt ? (
              <ReadOnlyField
                label="Uploaded"
                value={formatInvoiceDate(invoice.receiptUploadedAt)}
              />
            ) : null}
          </View>
        ) : null}
      </Card>
    </FeatureScreen>
  )
}
