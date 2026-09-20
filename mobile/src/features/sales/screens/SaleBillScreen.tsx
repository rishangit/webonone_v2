import { useCallback, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Body,
  Button,
  Card,
  CustomDialog,
  FeatureScreen,
  Muted,
  ReadOnlyField,
  Spinner,
  StatusTag,
  Subheading,
  useToast,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { salesApi } from '@/features/sales/services/salesApi'
import type { Sale } from '@/features/sales/types/sales.types'
import { canAccessCompanySession } from '@/features/sales/utils/canAccessCompanySession'
import { formatLkr, formatSaleWhen } from '@/features/sales/utils/formatMoney'
import { SALES_HISTORY_PATH } from '@/features/sales/utils/salePaths'

const KIND_LABEL: Record<string, string> = {
  product: 'Product',
  service: 'Service',
  space: 'Space',
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  other: 'Other',
}

type SaleBillScreenProps = {
  saleId: string
}

export function SaleBillScreen({ saleId }: SaleBillScreenProps) {
  const { t } = useTranslation('sales')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { user } = useSession()
  const { toast } = useToast()

  const canAccess = canAccessCompanySession(user?.role, user?.companyId)
  const canVoid = user?.role === 'company_admin' && Boolean(user?.companyId)

  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voidOpen, setVoidOpen] = useState(false)
  const [voiding, setVoiding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSale(await salesApi.get(saleId))
    } catch (err) {
      setSale(null)
      setError(err instanceof Error ? err.message : 'Failed to load bill')
    } finally {
      setLoading(false)
    }
  }, [saleId])

  useEffect(() => {
    void load()
  }, [load])

  if (user && !canAccess) {
    return <Redirect href="/" />
  }

  async function handleVoid() {
    setVoiding(true)
    try {
      const updated = await salesApi.void(saleId)
      setSale(updated)
      setVoidOpen(false)
      toast({ title: 'Sale voided' })
    } catch (err) {
      toast({
        title: 'Failed to void sale',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setVoiding(false)
    }
  }

  if (loading) {
    return (
      <FeatureScreen title={t('bill.title')} onBack={() => router.push(SALES_HISTORY_PATH)} backLabel={tc('back')}>
        <Spinner label="Loading bill…" />
      </FeatureScreen>
    )
  }

  if (error || !sale) {
    return (
      <FeatureScreen title={t('bill.title')} onBack={() => router.push(SALES_HISTORY_PATH)} backLabel={tc('back')}>
        <Alert variant="destructive">
          <AlertDescription>{error ?? 'Bill not found'}</AlertDescription>
        </Alert>
      </FeatureScreen>
    )
  }

  return (
    <FeatureScreen
      title={t('bill.title')}
      description={sale.billNumber ?? 'Sale receipt'}
      onBack={() => router.push(SALES_HISTORY_PATH)}
      backLabel={tc('back')}
      actions={
        canVoid && sale.status === 'completed' ? (
          <Button variant="destructive" size="sm" onPress={() => setVoidOpen(true)}>Void</Button>
        ) : undefined
      }
    >
      <Card className="gap-3">
        <View className="flex-row items-center justify-between gap-2">
          <Subheading>Items</Subheading>
          <StatusTag variant={sale.status === 'completed' ? 'verified' : 'pending'}>
            {sale.status === 'completed' ? 'Completed' : 'Void'}
          </StatusTag>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View className="min-w-full gap-2">
            {sale.lines.map((line) => (
              <View key={line.id} className="flex-row flex-wrap gap-2 border-b border-border py-2">
                <View className="min-w-[140px] flex-1">
                  <Body className="text-sm font-medium">{line.name}</Body>
                  {line.variantName ? <Muted className="text-xs">{line.variantName}</Muted> : null}
                  <Muted className="text-xs">{KIND_LABEL[line.itemKind] ?? line.itemKind}</Muted>
                </View>
                <Muted className="w-12 text-xs">×{line.quantity}</Muted>
                <Muted className="w-24 text-xs">{formatLkr(line.unitPrice, sale.currency)}</Muted>
                <Body className="w-24 text-sm font-medium">{formatLkr(line.lineTotal, sale.currency)}</Body>
              </View>
            ))}
          </View>
        </ScrollView>
        <Body className="text-lg font-semibold">Total {formatLkr(sale.total, sale.currency)}</Body>
      </Card>

      <Card className="gap-3">
        <Subheading>Bill details</Subheading>
        <ReadOnlyField label="Bill number" value={sale.billNumber ?? 'Draft'} />
        <ReadOnlyField label="Customer" value={sale.customerDisplayName} />
        {sale.customerEmail ? <ReadOnlyField label="Email" value={sale.customerEmail} /> : null}
        <ReadOnlyField
          label="Payment"
          value={sale.paymentMethod ? PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod : '—'}
        />
        <ReadOnlyField label="Sold" value={formatSaleWhen(sale.createdAt)} />
      </Card>

      <CustomDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        title={t('bill.voidTitle')}
        description="The bill stays in history as voided. This cannot be undone."
        footer={
          <View className="flex-row justify-end gap-2">
            <Button variant="outline" onPress={() => setVoidOpen(false)} disabled={voiding}>Cancel</Button>
            <Button variant="destructive" onPress={() => void handleVoid()} disabled={voiding}>
              {voiding ? 'Voiding…' : 'Void sale'}
            </Button>
          </View>
        }
      />
    </FeatureScreen>
  )
}
