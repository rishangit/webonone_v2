import { Pressable, View } from 'react-native'
import { Library, Plus } from 'lucide-react-native'
import { cn, Muted, Subheading, useThemedControlIconColor } from '@webonone/mobile-ui'

export type CatalogAddSource = 'library' | 'create'

export function CatalogWizardStepSource({
  value,
  onChange,
  entityLabel,
}: {
  value: CatalogAddSource | null
  onChange: (source: CatalogAddSource) => void
  entityLabel: string
}) {
  const iconColor = useThemedControlIconColor()
  const noun = entityLabel.toLowerCase()

  return (
    <View className="gap-3">
      <SourceCard
        selected={value === 'library'}
        onPress={() => onChange('library')}
        icon={<Library size={20} color={iconColor} />}
        title="Add from library"
        description={`Link a live Data library ${noun}. Customize later from the detail page if needed.`}
      />
      <SourceCard
        selected={value === 'create'}
        onPress={() => onChange('create')}
        icon={<Plus size={20} color={iconColor} />}
        title="Create new"
        description={`Create a company-owned ${noun} that is not linked to the library.`}
      />
    </View>
  )
}

function SourceCard({
  selected,
  onPress,
  icon,
  title,
  description,
}: {
  selected: boolean
  onPress: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-lg border bg-glass-bg p-4',
        selected ? 'border-primary' : 'border-glass-border',
      )}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-md border border-glass-border bg-input-background">
        {icon}
      </View>
      <Subheading className="text-sm">{title}</Subheading>
      <Muted className="mt-1 text-sm">{description}</Muted>
    </Pressable>
  )
}
