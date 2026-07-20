import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ScreenProps {
  children: React.ReactNode
  scroll?: boolean
}

export function Screen({ children, scroll = true }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 gap-4"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 gap-4 p-4">{children}</View>
      )}
    </SafeAreaView>
  )
}
