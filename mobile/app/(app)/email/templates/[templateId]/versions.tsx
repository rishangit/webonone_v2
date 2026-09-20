import { useLocalSearchParams } from 'expo-router'
import { TemplateVersionsScreen } from '@/features/email/screens/TemplateVersionsScreen'

export default function EmailTemplateVersionsRoute() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>()
  if (!templateId) return null
  return <TemplateVersionsScreen templateId={templateId} />
}
