import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, AlertDescription, Button, FeaturePage, ListPageBody } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { devicesActions } from '@/features/devices/store'
import type { SmsDevice } from '@/shared/types/sms.types'
import { DevicesList } from '../components/DevicesList'

const POLL_MS = 15_000

export function DevicesPage() {
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { items, listStatus, listError, busyId, actionError } = useAppSelector((s) => s.devices)

  const loading = listStatus === 'loading' && items.length === 0
  const error = listError ?? actionError
  usePlatformLoading(loading ? 'Loading devices…' : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(devicesActions.loadListRequested())
  }, [accessToken, dispatch])

  useEffect(() => {
    if (!accessToken) return
    const timer = window.setInterval(() => {
      dispatch(devicesActions.loadListRequested({ force: true }))
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [accessToken, dispatch])

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  function handleApprove(device: SmsDevice) {
    dispatch(devicesActions.approveRequested({ id: device.id }))
  }

  function handleRevoke(device: SmsDevice) {
    dispatch(devicesActions.revokeRequested({ id: device.id }))
  }

  function handleRefresh() {
    dispatch(devicesActions.loadListRequested({ force: true }))
  }

  return (
    <FeaturePage
      title="Gateway devices"
      description="Approve or revoke the phones that send SMS for your scope. Live status refreshes every 15 seconds."
      actions={
        <Button type="button" variant="outline" size="sm" onClick={handleRefresh}>
          Refresh now
        </Button>
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading ? (
        <ListPageBody>
          <div className="flex-1">
            <DevicesList
              devices={items}
              busyId={busyId}
              onApprove={handleApprove}
              onRevoke={handleRevoke}
            />
          </div>
        </ListPageBody>
      ) : null}
    </FeaturePage>
  )
}
