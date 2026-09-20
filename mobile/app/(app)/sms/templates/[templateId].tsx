import { useLocalSearchParams } from 'expo-router'
import { TemplateDetailScreen } from '@/features/sms/screens/TemplateDetailScreen'

export default function SmsTemplateDetailRoute() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>()
  if (!templateId) return null
  return <TemplateDetailScreen templateId={templateId} />
}
