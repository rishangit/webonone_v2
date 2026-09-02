import { useState } from 'react'
import { Button } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { TokenBillDialog } from '@/features/sales/components/TokenBillDialog'
import { TokenPosDialog } from '@/features/sales/components/TokenPosDialog'
import type { SaleItemKind, TokenPosSubject } from '@/features/sales/types/sales.types'

type SessionTokenSaleActionsProps = {
  token: TokenPosSubject
  serviceId: string
  serviceName: string
  enabledKinds: SaleItemKind[]
  canSell: boolean
  libraryItemsEnabled?: boolean
  onSaleCompleted?: (customerEmail?: string | null) => void
}

export function SessionTokenSaleActions({
  token,
  serviceId,
  serviceName,
  enabledKinds,
  canSell,
  libraryItemsEnabled = false,
  onSaleCompleted,
}: SessionTokenSaleActionsProps) {
  const { t } = useTranslation('calendar')
  const [addOpen, setAddOpen] = useState(false)
  const [billOpen, setBillOpen] = useState(false)

  if (!canSell || !serviceId || !serviceName) return null

  return (
    <>
      <Button
        type="button"
        variant="link"
        className="h-auto px-0 text-sm"
        onClick={() => setAddOpen(true)}
      >
        {t('session.addSale')}
      </Button>
      <Button
        type="button"
        variant="link"
        className="h-auto px-0 text-sm"
        onClick={() => setBillOpen(true)}
      >
        {t('session.viewBill')}
      </Button>
      <TokenPosDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        token={token}
        serviceId={serviceId}
        serviceName={serviceName}
        enabledKinds={enabledKinds}
        libraryItemsEnabled={libraryItemsEnabled}
        onBillSaved={onSaleCompleted}
      />
      <TokenBillDialog
        open={billOpen}
        onOpenChange={setBillOpen}
        token={token}
        onSaleCompleted={onSaleCompleted}
      />
    </>
  )
}
