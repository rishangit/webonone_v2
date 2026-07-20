import type { SmsDevice } from '@/shared/types'
import type { SimSlot } from '../../../modules/sms-sender'

export interface GatewayLogEntry {
  id: string
  toNumber: string
  status: 'sent' | 'failed'
  at: string
  error?: string
}

export interface GatewayState {
  supported: boolean
  registered: boolean
  device: SmsDevice | null
  approved: boolean
  permissionGranted: boolean
  simSlots: SimSlot[]
  selectedSubscriptionId: number | null
  running: boolean
  busy: boolean
  error: string | null
  log: GatewayLogEntry[]
}
