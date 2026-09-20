import { useLocalSearchParams } from 'expo-router'
import { TemplatePreviewScreen } from '@/features/email/screens/TemplatePreviewScreen'

export default function EmailTemplatePreviewRoute() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>()
  if (!templateId) return null
  return <TemplatePreviewScreen templateId={templateId} />
}
