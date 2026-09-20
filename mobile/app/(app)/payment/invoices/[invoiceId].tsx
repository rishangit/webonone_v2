import { useLocalSearchParams } from 'expo-router'
import { InvoiceDetailScreen } from '@/features/payment/screens/InvoiceDetailScreen'

export default function InvoiceDetailRoute() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>()
  if (!invoiceId) return null
  return <InvoiceDetailScreen invoiceId={invoiceId} />
}
