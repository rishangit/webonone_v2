import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { SmsDevice } from '@/shared/types/sms.types'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

interface DevicesListProps {
  devices: SmsDevice[]
  busyId: string | null
  onApprove: (device: SmsDevice) => void
  onRevoke: (device: SmsDevice) => void
}

function statusLabel(status: SmsDevice['status'], t: (k: string) => string): string {
  if (status === 'approved') return t('approved')
  if (status === 'revoked') return t('revoked')
  return t('pending')
}

export function DevicesList({ devices, busyId, onApprove, onRevoke }: DevicesListProps) {
  const { t } = useTranslation('devices')
  const rows = Array.isArray(devices) ? devices : []
  const [pendingRevoke, setPendingRevoke] = useState<SmsDevice | null>(null)

  if (rows.length === 0) {
    return <ItemListEmpty>{t('emptyScope')}</ItemListEmpty>
  }

  return (
    <>
      <ItemList>
        {rows.map((device) => {
          const isBusy = busyId === device.id

          return (
            <ItemListItem key={device.id}>
              <ItemListContent>
                <p className="font-medium">
                  {device.name}
                  <span
                    className={`ml-2 inline-block h-2 w-2 rounded-full ${
                      device.online ? 'bg-green-500' : 'bg-muted-foreground/40'
                    }`}
                    aria-label={device.online ? t('online') : t('offline')}
                  />
                </p>
                <p className="text-xs text-muted-foreground">
                  {device.scope === 'platform' ? t('platform') : t('company')} · {statusLabel(device.status, t)}{' '}
                  · {device.online ? t('online') : t('offline')} · {t('lastSeen')}{' '}
                  {device.lastSeenAt ? formatDisplayDateTime(device.lastSeenAt) : t('never')}
                  {device.appVersion ? ` · v${device.appVersion}` : ''}
                </p>
              </ItemListContent>
              <ItemListMenu ariaLabel={t('actionsFor', { name: device.name })}>
                <DropdownMenuItem disabled>{statusLabel(device.status, t)}</DropdownMenuItem>
                {device.status !== 'approved' ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onApprove(device)} disabled={isBusy}>
                      {t('approve')}
                    </DropdownMenuItem>
                  </>
                ) : null}
                {device.status !== 'revoked' ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setPendingRevoke(device)}
                      disabled={isBusy}
                    >
                      {t('revoke')}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </ItemListMenu>
            </ItemListItem>
          )
        })}
      </ItemList>
      <PlatformAlertConfirmDialog
        open={pendingRevoke !== null}
        title={pendingRevoke ? `${t('revoke')} ${pendingRevoke.name}?` : t('revoke')}
        description={t('deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('revoke')}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null)
        }}
        onConfirm={() => {
          if (pendingRevoke) onRevoke(pendingRevoke)
        }}
      />
    </>
  )
}
