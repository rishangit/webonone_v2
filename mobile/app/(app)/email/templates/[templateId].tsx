import { useLocalSearchParams } from 'expo-router'
import { TemplateDetailScreen } from '@/features/email/screens/TemplateDetailScreen'

export default function EmailTemplateDetailRoute() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>()
  if (!templateId) return null
  return <TemplateDetailScreen templateId={templateId} />
}
