import { useCallback, useEffect, useState } from 'react'
import { Badge, Body, Button, FeatureScreen, ItemList, ItemListContent, ItemListEmpty, ItemListItem, Spinner, useToast } from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { smsAdminApi, type SmsAdminDevice } from '@/shared/services/smsAdminApi'

export function DevicesScreen() {
  const { t } = useTranslation('devices')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [items, setItems] = useState<SmsAdminDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await smsAdminApi.listDevices())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function approve(id: string) {
    setBusyId(id)
    try {
      await smsAdminApi.approveDevice(id)
      toast({ title: 'Device approved' })
      await load()
    } catch (err) {
      toast({
        title: 'Failed to approve device',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function revoke(id: string) {
    setBusyId(id)
    try {
      await smsAdminApi.revokeDevice(id)
      toast({ title: 'Device revoked' })
      await load()
    } catch (err) {
      toast({
        title: 'Failed to revoke device',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <FeatureScreen
      title={t('tabDevices')}
      description={t('pageDescription')}
      actions={
        <Button size="sm" variant="outline" onPress={() => void load()}>
          {tc('refresh')}
        </Button>
      }
    >
      {loading ? <Spinner label={t('loading')} /> : null}
      {error ? <Body className="text-destructive">{error}</Body> : null}
      {!loading && items.length === 0 ? <ItemListEmpty>{t('emptyScope')}</ItemListEmpty> : null}
      <ItemList>
        {items.map((device) => (
          <ItemListItem key={device.id}>
            <ItemListContent
              title={device.name}
              subtitle={`${device.scope} · ${device.online ? 'Online' : 'Offline'}`}
            />
            <Badge
              tone={
                device.status === 'approved' ? 'success' : device.status === 'pending' ? 'warning' : 'neutral'
              }
            >
              {device.status}
            </Badge>
            {device.status === 'pending' ? (
              <Button size="sm" loading={busyId === device.id} onPress={() => void approve(device.id)}>
                Approve
              </Button>
            ) : null}
            {device.status === 'approved' ? (
              <Button
                size="sm"
                variant="destructive"
                loading={busyId === device.id}
                onPress={() => void revoke(device.id)}
              >
                Revoke
              </Button>
            ) : null}
          </ItemListItem>
        ))}
      </ItemList>
    </FeatureScreen>
  )
}
