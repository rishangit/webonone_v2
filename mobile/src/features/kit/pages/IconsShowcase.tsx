import { Text, View } from 'react-native'
import { Card, Muted, useThemedControlIconColor } from '@webonone/mobile-ui'
import { DemoSection } from '@/features/kit/DemoSection'
import { PLATFORM_ICON_CATEGORIES, PLATFORM_ICONS } from '@/features/kit/platformIcons'

export function IconsShowcase() {
  const iconColor = useThemedControlIconColor()
  return (
    <View className="gap-4">
      <DemoSection
        title="Icon library"
        description="All mobile icons use lucide-react-native. Reuse names from this catalog before adding new glyphs."
      >
        <Muted>
          {PLATFORM_ICONS.length} icons in use across @webonone/mobile-ui and this showcase. Default size in
          components is 16–18px.
        </Muted>
      </DemoSection>

      {PLATFORM_ICON_CATEGORIES.map((category) => {
        const icons = PLATFORM_ICONS.filter((entry) => entry.category === category.id)
        if (icons.length === 0) return null
        return (
          <DemoSection key={category.id} title={category.label} description={category.description}>
            <View className="flex-row flex-wrap gap-2">
              {icons.map((entry) => {
                const Icon = entry.icon
                return (
                  <Card key={entry.name} compact className="w-[30%] items-center gap-2 p-3">
                    <View className="h-10 w-10 items-center justify-center">
                      <Icon size={20} color={iconColor} />
                    </View>
                    <Text className="text-center text-xs font-medium text-foreground">{entry.name}</Text>
                  </Card>
                )
              })}
            </View>
          </DemoSection>
        )
      })}
    </View>
  )
}
