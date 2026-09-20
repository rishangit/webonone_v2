import { useLocalSearchParams } from 'expo-router'
import { SaleBillScreen } from '@/features/sales/screens/SaleBillScreen'

export default function SaleBillRoute() {
  const { saleId } = useLocalSearchParams<{ saleId: string }>()
  return <SaleBillScreen saleId={saleId ?? ''} />
}
