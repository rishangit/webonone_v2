import { env } from '@/shared/config/env'
import { createApiClient } from './apiClient'
import { secureStorage } from './secureStorage'
import type { DeviceMessage, DeviceStatusReport, SmsDevice } from '@/shared/types'

const client = createApiClient(`${env.smsApiBaseUrl}/api/v1`)

const DEVICE_KEY_HEADER = 'X-Sms-Device-Key'

async function deviceHeaders(): Promise<Record<string, string>> {
  const key = await secureStorage.getDeviceKey()
  return key ? { [DEVICE_KEY_HEADER]: key } : {}
}

interface SimSlotInfo {
  slot: number
  carrier?: string
  number?: string
}

export const smsApi = {
  /** Register this phone as a gateway device. Uses the user JWT; scope is server-derived. */
  async registerDevice(input: {
    name: string
    appVersion?: string
    simSlots?: SimSlotInfo[]
  }): Promise<{ device: SmsDevice; deviceKey: string }> {
    return client<{ device: SmsDevice; deviceKey: string }>('/device/register', {
      method: 'POST',
      body: input,
    })
  },

  /** Periodic heartbeat (device key auth). Reports app version + SIM slots. */
  async heartbeat(input: {
    appVersion?: string
    simSlots?: SimSlotInfo[]
  }): Promise<{ device: SmsDevice; approved: boolean }> {
    return client<{ device: SmsDevice; approved: boolean }>('/device/heartbeat', {
      method: 'POST',
      body: input,
      bearer: null,
      extraHeaders: await deviceHeaders(),
    })
  },

  /** Claim up to `max` scoped pending messages for this device (device key auth). */
  async claimMessages(max = 5): Promise<DeviceMessage[]> {
    const data = await client<{ messages: DeviceMessage[] }>(`/device/messages?max=${max}`, {
      bearer: null,
      extraHeaders: await deviceHeaders(),
    })
    return data.messages
  },

  /** Report delivery status for a claimed message (device key auth). */
  async reportStatus(messageId: string, report: DeviceStatusReport): Promise<void> {
    await client<{ ok: boolean }>(`/device/messages/${messageId}/status`, {
      method: 'POST',
      body: report,
      bearer: null,
      extraHeaders: await deviceHeaders(),
    })
  },
}

export type { SimSlotInfo }
