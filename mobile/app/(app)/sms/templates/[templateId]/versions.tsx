import { useLocalSearchParams } from 'expo-router'
import { TemplateVersionsScreen } from '@/features/sms/screens/TemplateVersionsScreen'

export default function SmsTemplateVersionsRoute() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>()
  if (!templateId) return null
  return <TemplateVersionsScreen templateId={templateId} />
}
