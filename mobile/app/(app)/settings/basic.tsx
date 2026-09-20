import { useLocalSearchParams } from 'expo-router'
import { BasicSettingsScreen } from '@/features/settings/BasicSettingsScreen'

type BasicSettingsTab = 'account' | 'appearance' | 'ai' | 'downloads'

function parseBasicTab(tab?: string): BasicSettingsTab {
  if (tab === 'appearance' || tab === 'ai' || tab === 'downloads') return tab
  return 'account'
}

export default function BasicSettingsRoute() {
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  return <BasicSettingsScreen initialTab={parseBasicTab(tab)} />
}
