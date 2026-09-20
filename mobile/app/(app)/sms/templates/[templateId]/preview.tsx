import { useLocalSearchParams } from 'expo-router'
import { TemplatePreviewScreen } from '@/features/sms/screens/TemplatePreviewScreen'

export default function SmsTemplatePreviewRoute() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>()
  if (!templateId) return null
  return <TemplatePreviewScreen templateId={templateId} />
}
