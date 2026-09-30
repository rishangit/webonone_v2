import { useLocalSearchParams } from 'expo-router'
import { BasicSettingsScreen } from '@/features/settings/BasicSettingsScreen'

type BasicSettingsTab = 'general' | 'account' | 'appearance' | 'ai' | 'downloads'

function parseBasicTab(tab?: string): BasicSettingsTab {
  if (tab === 'account' || tab === 'appearance' || tab === 'ai' || tab === 'downloads') return tab
  if (tab === 'general') return 'general'
  return 'general'
}

export default function BasicSettingsRoute() {
  const { tab } = useLocalSearchParams<{ tab?: string }>()
  return <BasicSettingsScreen initialTab={parseBasicTab(tab)} />
}
