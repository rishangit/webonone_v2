import { Pressable, View } from 'react-native'
import { Badge, Body, Button, Card, Heading, Muted, Screen, Subheading } from '@/ui'
import { useSession } from '../auth/SessionContext'
import { useGateway } from './useGateway'

export function GatewayScreen() {
  const { user } = useSession()
  const { state, register, requestPermission, selectSim, start, stop } = useGateway()

  if (!state.supported) {
    return (
      <Screen>
        <Heading>SMS Gateway</Heading>
        <Card className="gap-2">
          <Subheading>Android-only feature</Subheading>
          <Muted>
            Sending SMS over a SIM is only available on Android gateway builds. You are signed in,
            but this device cannot act as a gateway.
          </Muted>
        </Card>
      </Screen>
    )
  }

  const scopeLabel = user?.scope === 'platform' ? 'Platform (system SMS)' : 'Company SMS'

  return (
    <Screen>
      <View className="gap-1">
        <Heading>SMS Gateway</Heading>
        <Muted>Scope: {scopeLabel}</Muted>
      </View>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Subheading>1 · Register device</Subheading>
          {state.registered ? (
            <Badge tone={state.approved ? 'success' : 'warning'}>
              {state.approved ? 'Approved' : 'Pending approval'}
            </Badge>
          ) : (
            <Badge tone="neutral">Not registered</Badge>
          )}
        </View>
        {!state.registered ? (
          <>
            <Muted>Register this phone so an admin can approve it in the SMS admin app.</Muted>
            <Button loading={state.busy} onPress={register}>
              Register this device
            </Button>
          </>
        ) : !state.approved ? (
          <Muted>Waiting for an administrator to approve this device.</Muted>
        ) : (
          <Muted>This device is approved and can send SMS for your scope.</Muted>
        )}
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Subheading>2 · Permission</Subheading>
          <Badge tone={state.permissionGranted ? 'success' : 'warning'}>
            {state.permissionGranted ? 'Granted' : 'Required'}
          </Badge>
        </View>
        {!state.permissionGranted ? (
          <Button variant="outline" onPress={requestPermission}>
            Grant SEND_SMS permission
          </Button>
        ) : (
          <Muted>SEND_SMS permission granted.</Muted>
        )}
      </Card>

      <Card className="gap-3">
        <Subheading>3 · SIM</Subheading>
        {state.simSlots.length === 0 ? (
          <Muted>No SIM cards detected.</Muted>
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
                    SIM {sim.slot + 1}
                    {sim.carrier ? ` · ${sim.carrier}` : ''}
                    {sim.number ? ` · ${sim.number}` : ''}
                  </Body>
                  {selected ? <Badge tone="success">Selected</Badge> : null}
                </Pressable>
              )
            })}
          </View>
        )}
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Subheading>4 · Gateway</Subheading>
          <Badge tone={state.running ? 'success' : 'neutral'}>{state.running ? 'Running' : 'Stopped'}</Badge>
        </View>
        {state.running ? (
          <Button variant="destructive" onPress={stop}>
            Stop gateway
          </Button>
        ) : (
          <Button onPress={start} disabled={!state.approved}>
            Start gateway
          </Button>
        )}
        {!state.approved ? <Muted>Approve the device before starting.</Muted> : null}
      </Card>

      {state.error ? (
        <Card>
          <Body className="text-destructive">{state.error}</Body>
        </Card>
      ) : null}

      <Card className="gap-2">
        <Subheading>Recent activity</Subheading>
        {state.log.length === 0 ? (
          <Muted>No messages sent yet.</Muted>
        ) : (
          state.log.map((entry) => (
            <View key={`${entry.id}-${entry.at}`} className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Body>{entry.toNumber}</Body>
                {entry.error ? <Muted className="text-destructive">{entry.error}</Muted> : null}
              </View>
              <Badge tone={entry.status === 'sent' ? 'success' : 'danger'}>
                {entry.status === 'sent' ? 'Sent' : 'Failed'}
              </Badge>
            </View>
          ))
        )}
      </Card>
    </Screen>
  )
}
