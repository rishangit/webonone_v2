import { FeaturePage } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'

export function HomePage() {
  const { user, accessToken } = useAppSelector((s) => s.auth)

  return (
    <FeaturePage
      title={`Welcome, ${user?.displayName ?? 'User'}!`}
      description="You are signed in to WebOnOne."
    >
      <p className="text-sm text-muted-foreground">
        {accessToken ? 'Session active with Bearer JWT.' : 'Not signed in.'}
      </p>
    </FeaturePage>
  )
}
