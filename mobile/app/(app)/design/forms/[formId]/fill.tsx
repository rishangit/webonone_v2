import { FormFillScreen } from '@/features/design/screens/FormFillScreen'
import { useLocalSearchParams } from 'expo-router'

export default function DesignFormFillRoute() {
  const { formId } = useLocalSearchParams<{ formId: string }>()
  return <FormFillScreen formId={String(formId ?? '')} />
}
