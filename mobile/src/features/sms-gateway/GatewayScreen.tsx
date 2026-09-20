import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Badge, Body, Button, Card, FeatureScreen, Muted, Subheading } from '@webonone/mobile-ui'
import { useSession } from '../auth/SessionContext'
import { useGateway } from './useGateway'

export function GatewayScreen() {
  const { t } = useTranslation('devices')
  const { t: tSession } = useTranslation('session')
  const { user } = useSession()
  const { state, register, requestPermission, selectSim, start, stop } = useGateway()
  const isAdmin = user?.role === 'super_admin' || user?.role === 'company_admin'

  if (!isAdmin) {
    return (
      <FeatureScreen title={t('thisDevice.title')} description={t('thisDevice.descriptionRestricted')}>
        <Card>
          <Muted>{t('thisDevice.restricted')}</Muted>
        </Card>
      </FeatureScreen>
    )
  }

  if (!state.supported) {
    return (
      <FeatureScreen title={t('thisDevice.title')} description={t('thisDevice.descriptionUnsupported')}>
        <Card className="gap-2">
          <Subheading>{t('thisDevice.androidOnlyTitle')}</Subheading>
          <Muted>{t('thisDevice.androidOnlyBody')}</Muted>
        </Card>
      </FeatureScreen>
    )
  }

  const scopeLabel =
    user?.scope === 'platform' ? t('thisDevice.scopePlatform') : t('thisDevice.scopeCompany')
  const contextLine =
    user?.role === 'company_admin'
      ? `${user.companyName ?? t('company')} · ${t('thisDevice.companyOwner')}`
      : tSession('roles.superAdmin')

  return (
    <FeatureScreen title={t('thisDevice.title')} description={t('thisDevice.description')}>
      <View className="gap-1">
        <Body className="font-semibold">{contextLine}</Body>
        <Muted>{scopeLabel}</Muted>
      </View>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Subheading>{t('thisDevice.stepRegister')}</Subheading>
          {state.registered ? (
            <Badge tone={state.approved ? 'success' : 'warning'}>
              {state.approved ? t('approved') : t('thisDevice.pendingApproval')}
            </Badge>
          ) : (
            <Badge tone="neutral">{t('thisDevice.notRegistered')}</Badge>
          )}
        </View>
        {!state.registered ? (
          <>
            <Muted>{t('thisDevice.registerHint')}</Muted>
            <Button loading={state.busy} onPress={register}>
              {t('thisDevice.register')}
            </Button>
          </>
        ) : !state.approved ? (
          <Muted>{t('thisDevice.waitingApproval')}</Muted>
        ) : (
          <Muted>{t('thisDevice.approvedHint')}</Muted>
        )}
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Subheading>{t('thisDevice.stepPermission')}</Subheading>
          <Badge tone={state.permissionGranted ? 'success' : 'warning'}>
            {state.permissionGranted ? t('thisDevice.granted') : t('thisDevice.required')}
          </Badge>
        </View>
        {!state.permissionGranted ? (
          <Button variant="outline" onPress={requestPermission}>
            {t('thisDevice.grantPermission')}
          </Button>
        ) : (
          <Muted>{t('thisDevice.permissionGranted')}</Muted>
        )}
      </Card>

      <Card className="gap-3">
        <Subheading>{t('thisDevice.stepSim')}</Subheading>
        {state.simSlots.length === 0 ? (
          <Muted>{t('thisDevice.noSim')}</Muted>
        ) : (
          <View className="gap-2">
            {state.simSlots.map((sim) => {
              const selected = sim.subscriptionId === state.selectedSubscriptionId
              return (
                <Pressable
                  key={sim.subscriptionId}
                  onPress={() => selectSim(sim.subscriptionId)}
                  className={`flex-row items-center justify-between rounded-lg border px-3 py-3 ${
                    selected ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <Body>
                    {t('thisDevice.simLabel', { slot: sim.slot + 1 })}
                    {sim.carrier ? ` · ${sim.carrier}` : ''}
                    {sim.number ? ` · ${sim.number}` : ''}
                  </Body>
                  {selected ? <Badge tone="success">{t('thisDevice.selected')}</Badge> : null}
                </Pressable>
              )
            })}
          </View>
        )}
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Subheading>{t('thisDevice.stepGateway')}</Subheading>
          <Badge tone={state.running ? 'success' : 'neutral'}>
            {state.running ? t('thisDevice.running') : t('thisDevice.stopped')}
          </Badge>
        </View>
        {state.running ? (
          <Button variant="destructive" onPress={stop}>
            {t('thisDevice.stop')}
          </Button>
        ) : (
          <Button onPress={start} disabled={!state.approved}>
            {t('thisDevice.start')}
          </Button>
        )}
        {!state.approved ? <Muted>{t('thisDevice.approveBeforeStart')}</Muted> : null}
      </Card>

      {state.error ? (
        <Card>
          <Body className="text-destructive">{state.error}</Body>
        </Card>
      ) : null}

      <Card className="gap-2">
        <Subheading>{t('thisDevice.recentActivity')}</Subheading>
        {state.log.length === 0 ? (
          <Muted>{t('thisDevice.noMessages')}</Muted>
        ) : (
          state.log.map((entry) => (
            <View key={`${entry.id}-${entry.at}`} className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Body>{entry.toNumber}</Body>
                {entry.error ? <Muted className="text-destructive">{entry.error}</Muted> : null}
              </View>
              <Badge tone={entry.status === 'sent' ? 'success' : 'danger'}>
                {entry.status === 'sent' ? t('thisDevice.sent') : t('thisDevice.failed')}
              </Badge>
            </View>
          ))
        )}
      </Card>
    </FeatureScreen>
  )
}
