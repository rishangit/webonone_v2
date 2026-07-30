import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Body, Button, Card, Heading, Muted, Screen, Subheading } from '@/ui'
import { useSession } from './SessionContext'
import type { GatewayRoleOption } from './sessionRoleApi'

function optionTitle(option: GatewayRoleOption): string {
  if (option.role === 'super_admin') return 'Super Admin'
  return option.companyName ?? option.label
}

function optionSubtitle(option: GatewayRoleOption): string {
  if (option.role === 'super_admin') return 'Platform gateway — system-level SMS'
  return 'Company owner — company SMS gateway'
}

export function SelectRoleScreen() {
  const { roleOptions, isBlocked, blockReason, selectRole, logout } = useSession()
  const [pending, setPending] = useState<GatewayRoleOption | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    if (!pending) return
    setSubmitting(true)
    setError(null)
    try {
      await selectRole(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set account')
    } finally {
      setSubmitting(false)
    }
  }

  if (isBlocked) {
    return (
      <Screen>
        <View className="gap-1">
          <Heading>Cannot use SMS gateway</Heading>
          <Muted>{blockReason ?? 'This account cannot set up an SMS gateway.'}</Muted>
        </View>
        <Card className="gap-3">
          <Body>
            Sign in with a Super Admin or Company Owner account. Member and staff accounts are not
            supported on this app.
          </Body>
          <Button variant="outline" onPress={logout}>
            Sign out
          </Button>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <View className="gap-1">
        <Heading>Choose account</Heading>
        <Muted>
          Select Super Admin for system SMS, or a company you own for company SMS. Your choice stays
          active until you sign out.
        </Muted>
      </View>

      <Card className="gap-3">
        <Subheading>Accounts</Subheading>
        <View className="gap-2">
          {roleOptions.map((option) => {
            const selected =
              pending?.role === option.role &&
              (pending.companyId ?? null) === (option.companyId ?? null)
            return (
              <Pressable
                key={`${option.role}-${option.companyId ?? 'platform'}`}
                onPress={() => setPending(option)}
                className={`rounded-lg border px-3 py-3 ${
                  selected ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <Body className="font-semibold">{optionTitle(option)}</Body>
                <Muted>{optionSubtitle(option)}</Muted>
              </Pressable>
            )
          })}
        </View>
        {error ? <Body className="text-destructive">{error}</Body> : null}
        <Button loading={submitting} disabled={!pending || submitting} onPress={handleContinue}>
          Continue
        </Button>
        <Button variant="outline" disabled={submitting} onPress={logout}>
          Sign out
        </Button>
      </Card>
    </Screen>
  )
}
