import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { SmsDevice } from '@/shared/types/sms.types'

interface DevicesListProps {
  devices: SmsDevice[]
  busyId: string | null
  onApprove: (device: SmsDevice) => void
  onRevoke: (device: SmsDevice) => void
}

function statusLabel(status: SmsDevice['status']): string {
  if (status === 'approved') return 'Approved'
  if (status === 'revoked') return 'Revoked'
  return 'Pending'
}

function formatSeen(iso: string | null): string {
  if (!iso) return 'never'
  return new Date(iso).toLocaleString()
}

export function DevicesList({ devices, busyId, onApprove, onRevoke }: DevicesListProps) {
  const rows = Array.isArray(devices) ? devices : []

  if (rows.length === 0) {
    return <ItemListEmpty>No gateway devices registered for your scope.</ItemListEmpty>
  }

  return (
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
                  aria-label={device.online ? 'online' : 'offline'}
                />
              </p>
              <p className="text-xs text-muted-foreground">
                {device.scope === 'platform' ? 'Platform' : 'Company'} · {statusLabel(device.status)}{' '}
                · {device.online ? 'Online' : 'Offline'} · Last seen {formatSeen(device.lastSeenAt)}
                {device.appVersion ? ` · v${device.appVersion}` : ''}
              </p>
            </ItemListContent>
            <ItemListMenu ariaLabel={`Actions for ${device.name}`}>
              <DropdownMenuItem disabled>{statusLabel(device.status)}</DropdownMenuItem>
              {device.status !== 'approved' ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onApprove(device)} disabled={isBusy}>
                    Approve
                  </DropdownMenuItem>
                </>
              ) : null}
              {device.status !== 'revoked' ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onRevoke(device)}
                    disabled={isBusy}
                  >
                    Revoke
                  </DropdownMenuItem>
                </>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
