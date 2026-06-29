import { FeaturePage } from '@webonone/ui-kit'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <FeaturePage title={title} description={description}>
      <p className="text-sm text-muted-foreground">Coming in a later phase of spec 1.9.0.</p>
    </FeaturePage>
  )
}
