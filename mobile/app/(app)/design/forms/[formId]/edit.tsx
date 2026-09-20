import { FormDesignerScreen } from '@/features/design/screens/FormDesignerScreen'
import { useLocalSearchParams } from 'expo-router'

export default function DesignFormEditRoute() {
  const { formId } = useLocalSearchParams<{ formId: string }>()
  return <FormDesignerScreen formId={String(formId ?? '')} />
}
