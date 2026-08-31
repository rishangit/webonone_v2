import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import { Mail } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
  ReadOnlyField,
  StatusTag,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { canAccessCompanySession, canManageCompanyEvents } from '@/features/session/utils/canAccessCompanySession'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { salesActions } from '@/features/sales/store'
import { formatLkr, formatSaleWhen } from '@/features/sales/utils/formatMoney'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

export function SaleBillPage() {
  const { t } = useTranslation('sales')
  const { t: tc } = useTranslation('common')
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const sale = useAppSelector((s) => s.sales.detail)
  const detailStatus = useAppSelector((s) => s.sales.detailStatus)
  const detailError = useAppSelector((s) => s.sales.detailError)
  const [voidOpen, setVoidOpen] = useState(false)
  const voidingRef = useRef(false)

  const canAccess = selectionComplete && canAccessCompanySession(activeRole, activeCompanyId)
  const canVoid = selectionComplete && canManageCompanyEvents(activeRole, activeCompanyId)
  const loading = detailStatus === 'loading' || (detailStatus === 'saving' && !sale)
  usePlatformLoading(loading ? t('bill.loading') : null)

  useEffect(() => {
    if (!id) return
    dispatch(salesActions.fetchDetailRequested({ id, force: true }))
    return () => {
      dispatch(salesActions.resetDetail())
    }
  }, [dispatch, id])

  useEffect(() => {
    if (!voidingRef.current) return
    if (detailStatus === 'saving') return
    voidingRef.current = false
    if (detailError) {
      toast({
        title: t('bill.voidFailed'),
        description: detailError,
        variant: 'destructive',
      })
      return
    }
    toast({ title: t('bill.voided') })
  }, [detailStatus, detailError, t, toast])

  if (selectionComplete && !canAccess) {
    return <Navigate to="/" replace />
  }

  if (detailError && !sale) {
    return (
      <FeaturePage title={t('bill.title')} onBack={() => navigate('/sales')} backLabel={tc('back')}>
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!sale) return null

  const kindLabel: Record<string, string> = {
    product: t('kinds.product'),
    service: t('kinds.service'),
    space: t('kinds.space'),
  }

  return (
    <FeaturePage
      title={sale.billNumber ?? t('status.draft')}
      description={t('bill.description')}
      onBack={() => navigate('/sales')}
      backLabel={tc('back')}
      actions={
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            {t('bill.print')}
          </Button>
          {sale.status === 'completed' && canVoid ? (
            <Button type="button" variant="destructive" size="sm" onClick={() => setVoidOpen(true)}>
              {t('bill.void')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-3 print:grid-cols-1">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('bill.linesTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">{t('bill.item')}</th>
                      <th className="py-2 pr-3">{t('bill.kind')}</th>
                      <th className="py-2 pr-3 text-right">{t('bill.qty')}</th>
                      <th className="py-2 pr-3 text-right">{t('bill.unit')}</th>
                      <th className="py-2 text-right">{t('bill.lineTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sale.lines ?? []).map((line) => (
                      <tr key={line.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{line.name}</td>
                        <td className="py-2 pr-3">{kindLabel[line.itemKind] ?? line.itemKind}</td>
                        <td className="py-2 pr-3 text-right">{line.quantity}</td>
                        <td className="py-2 pr-3 text-right">{formatLkr(line.unitPrice, sale.currency)}</td>
                        <td className="py-2 text-right">{formatLkr(line.lineTotal, sale.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-right text-lg font-semibold">
                {t('bill.total', { amount: formatLkr(sale.total, sale.currency) })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('bill.detailsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusTag variant={sale.status === 'completed' ? 'verified' : 'pending'}>
                {sale.status === 'completed' ? t('status.completed') : t('status.void')}
              </StatusTag>
              <DetailField label={t('bill.customer')} value={sale.customerDisplayName} />
              <ReadOnlyField label={t('bill.email')} value={sale.customerEmail} icon={Mail} />
              <DetailField
                label={t('bill.payment')}
                value={sale.paymentMethod ? t(`payment.${sale.paymentMethod}`) : '—'}
              />
              <DetailField label={t('bill.when')} value={formatSaleWhen(sale.createdAt)} />
              {sale.sessionTokenId ? (
                <DetailField label={t('bill.sessionToken')} value={sale.sessionTokenId} />
              ) : null}
              {sale.notes ? <DetailField label={t('pos.notes')} value={sale.notes} /> : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <PlatformAlertConfirmDialog
        open={voidOpen}
        title={t('bill.voidTitle')}
        description={t('bill.voidDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('bill.void')}
        onOpenChange={setVoidOpen}
        onConfirm={() => {
          voidingRef.current = true
          setVoidOpen(false)
          dispatch(salesActions.voidRequested(sale.id))
        }}
      />
    </FeaturePage>
  )
}
