import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  CollectionListView,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemListCardPlaceholderImage,
  ItemListCollectionCard,
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
  const { t, i18n } = useTranslation('devices')
  const { t: tc } = useTranslation('common')
  const rows = Array.isArray(devices) ? devices : []
  const [pendingRevoke, setPendingRevoke] = useState<SmsDevice | null>(null)

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: SmsDevice, b: SmsDevice) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (device: SmsDevice) => device.name,
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (device: SmsDevice) => statusLabel(device.status, t),
      },
    ],
    [t, tc],
  )

  function renderRowMenu(device: SmsDevice) {
    const isBusy = busyId === device.id
    return (
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
    )
  }

  function rowBody(device: SmsDevice) {
    return (
      <>
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
          {device.scope === 'platform' ? t('platform') : t('company')} · {statusLabel(device.status, t)} ·{' '}
          {device.online ? t('online') : t('offline')} · {t('lastSeen')}{' '}
          {device.lastSeenAt ? formatDisplayDateTime(device.lastSeenAt, i18n.language) : t('never')}
          {device.appVersion ? ` · v${device.appVersion}` : ''}
        </p>
      </>
    )
  }

  return (
    <>
      <CollectionListView
        items={rows}
        getRowKey={(device) => device.id}
        columns={columns}
        empty={<ItemListEmpty>{t('emptyScope')}</ItemListEmpty>}
        renderGridActions={renderRowMenu}
        renderListItem={(device) => (
          <ItemListItem>
            <ItemListContent>{rowBody(device)}</ItemListContent>
            {renderRowMenu(device)}
          </ItemListItem>
        )}
        renderCard={(device) => (
          <ItemListCollectionCard
            image={<ItemListCardPlaceholderImage alt={device.name} />}
            menu={renderRowMenu(device)}
          >
            {rowBody(device)}
          </ItemListCollectionCard>
        )}
      />
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
