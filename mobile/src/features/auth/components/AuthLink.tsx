import { Pressable, Text } from 'react-native'
import { useRouter, type Href } from 'expo-router'

export function AuthLink({ label, href }: { label: string; href: Href }) {
  const router = useRouter()

  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href)}>
      <Text className="text-sm text-primary">{label}</Text>
    </Pressable>
  )
}
