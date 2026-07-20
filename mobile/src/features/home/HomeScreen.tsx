import { View } from 'react-native'
import { Badge, Body, Button, Card, Heading, Muted, Screen, Subheading } from '@/ui'
import { useSession } from '../auth/SessionContext'

function roleLabel(role: string): string {
  if (role === 'super_admin') return 'Super admin'
  if (role === 'company_admin') return 'Company admin'
  return 'Member'
}

export function HomeScreen() {
  const { user, logout } = useSession()

  if (!user) return null

  return (
    <Screen>
      <Heading>Home</Heading>

      <Card className="gap-2">
        <Subheading>Signed in</Subheading>
        <Body>{user.email}</Body>
        <View className="flex-row gap-2">
          <Badge tone="neutral">{roleLabel(user.role)}</Badge>
          {user.scope ? (
            <Badge tone="neutral">{user.scope === 'platform' ? 'Platform scope' : 'Company scope'}</Badge>
          ) : null}
        </View>
      </Card>

      <Card className="gap-2">
        <Subheading>SMS gateway</Subheading>
        <Muted>
          Configure this phone as a gateway from the Gateway tab. Registered devices must be approved
          in the SMS admin app before they can send.
        </Muted>
      </Card>

      <Button variant="outline" onPress={logout}>
        Sign out
      </Button>
    </Screen>
  )
}
