import { View } from 'react-native'
import { Badge, Body, Button, Card, Heading, Muted, Screen, Subheading } from '@/ui'
import { useSession } from '../auth/SessionContext'

function roleLabel(role: string): string {
  if (role === 'super_admin') return 'Super Admin'
  if (role === 'company_admin') return 'Company owner'
  return 'Member'
}

export function HomeScreen() {
  const { user, logout } = useSession()

  if (!user) return null

  const isOwner = user.role === 'company_admin'
  const gatewayHint = isOwner
    ? 'Configure this phone as your company SMS gateway from the Gateway tab. Devices must be approved in the SMS admin app before they can send company messages.'
    : 'Configure this phone as the platform SMS gateway from the Gateway tab. Devices must be approved in the SMS admin app before they can send system messages.'

  return (
    <Screen>
      <Heading>Home</Heading>

      <Card className="gap-2">
        <Subheading>Signed in</Subheading>
        <Body>{user.email}</Body>
        {isOwner && user.companyName ? <Body className="font-semibold">{user.companyName}</Body> : null}
        <View className="flex-row flex-wrap gap-2">
          <Badge tone="neutral">{roleLabel(user.role)}</Badge>
          {user.scope ? (
            <Badge tone="neutral">{user.scope === 'platform' ? 'Platform scope' : 'Company scope'}</Badge>
          ) : null}
        </View>
      </Card>

      <Card className="gap-2">
        <Subheading>SMS gateway</Subheading>
        <Muted>{gatewayHint}</Muted>
      </Card>

      <Button variant="outline" onPress={logout}>
        Sign out
      </Button>
    </Screen>
  )
}
