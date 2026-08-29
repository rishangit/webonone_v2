import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  cn,
  FeaturePage,
  ListPageBody,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsPageClassName,
  tabsPageContentClassName,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { devicesActions } from '@/features/devices/store'
import { GatewaySettingsCard } from '@/features/gateway/components/GatewaySettingsCard'
import { gatewayActions } from '@/features/gateway/store'
import { useDetailTabParam } from '@/shared/hooks/useDetailTabParam'
import type { SmsDevice } from '@/shared/types/sms.types'
import { DevicesList } from '../components/DevicesList'

const POLL_MS = 15_000
const DEVICE_TABS = ['devices', 'settings'] as const
type DeviceTab = (typeof DEVICE_TABS)[number]

export function DevicesPage() {
  const { t } = useTranslation('devices')

  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((s) => s.auth)
  const { items, listStatus, listError, busyId, actionError } = useAppSelector((s) => s.devices)
  const gatewayMode = useAppSelector((s) => s.gateway.config?.mode)
  const [tab, setTab] = useDetailTabParam(DEVICE_TABS, 'devices')

  const loading = listStatus === 'loading' && items.length === 0
  const error = listError ?? actionError
  usePlatformLoading(tab === 'devices' && loading ? t('loading') : null)

  useEffect(() => {
    if (!accessToken) return
    dispatch(devicesActions.loadListRequested())
    dispatch(gatewayActions.loadRequested())
  }, [accessToken, dispatch])

  useEffect(() => {
    if (!accessToken || tab !== 'devices') return
    const timer = window.setInterval(() => {
      dispatch(devicesActions.loadListRequested({ force: true }))
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [accessToken, dispatch, tab])

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
      title={t('pageTitle')}
      description={t('pageDescription')}
      actions={
        tab === 'devices' ? (
          <Button type="button" variant="outline" size="sm" onClick={handleRefresh}>
            {t('refreshNow')}
          </Button>
        ) : null
      }
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as DeviceTab)} className={tabsPageClassName}>
        <TabsList>
          <TabsTrigger value="devices">{t('tabDevices')}</TabsTrigger>
          <TabsTrigger value="settings">{t('tabSettings')}</TabsTrigger>
        </TabsList>
        <TabsContent value="devices" className={cn(tabsPageContentClassName, 'space-y-4')}>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {gatewayMode === 'text_lk' ? (
            <Alert>
              <AlertDescription>{t('textLkActive')}</AlertDescription>
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
        </TabsContent>
        <TabsContent value="settings" className={tabsPageContentClassName}>
          <GatewaySettingsCard />
        </TabsContent>
      </Tabs>
    </FeaturePage>
  )
}
