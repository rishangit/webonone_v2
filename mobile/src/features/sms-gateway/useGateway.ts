import { useCallback, useEffect, useRef, useState } from 'react'
import Constants from 'expo-constants'
import { smsApi, type SimSlotInfo } from '@/shared/services/smsApi'
import { secureStorage } from '@/shared/services/secureStorage'
import type { SmsDevice } from '@/shared/types'
import {
  getSimSlots,
  hasSendSmsPermission,
  isSmsGatewaySupported,
  requestSendSmsPermission,
  sendSms,
  type SimSlot,
} from '../../../modules/sms-sender'
import type { GatewayLogEntry, GatewayState } from './gatewayTypes'

const POLL_INTERVAL_MS = 5_000
const APPROVAL_POLL_INTERVAL_MS = 10_000
const HEARTBEAT_EVERY_TICKS = 6 // ~30s at 5s cadence
const MAX_BATCH = 5
const MAX_LOG = 50

const appVersion = Constants.expoConfig?.version ?? '1.0.0'

function toSimSlotInfo(slots: SimSlot[]): SimSlotInfo[] {
  return slots.map((s) => ({ slot: s.slot, carrier: s.carrier, number: s.number }))
}

export function useGateway() {
  const [state, setState] = useState<GatewayState>({
    supported: isSmsGatewaySupported(),
    registered: false,
    device: null,
    approved: false,
    permissionGranted: false,
    simSlots: [],
    selectedSubscriptionId: null,
    running: false,
    busy: false,
    error: null,
    log: [],
  })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const approvalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef(0)
  const runningRef = useRef(false)
  const selectedSubRef = useRef<number | null>(null)

  const patch = useCallback((next: Partial<GatewayState>) => {
    setState((prev) => ({ ...prev, ...next }))
  }, [])

  const appendLog = useCallback((entry: GatewayLogEntry) => {
    setState((prev) => ({ ...prev, log: [entry, ...prev.log].slice(0, MAX_LOG) }))
  }, [])

  /** Sync device + approval from the server (works while pending; does not require Start). */
  const syncStatus = useCallback(async (): Promise<boolean> => {
    const key = await secureStorage.getDeviceKey()
    if (!key) return false
    try {
      const slots = await getSimSlots()
      const { device, approved } = await smsApi.heartbeat({
        appVersion,
        simSlots: toSimSlotInfo(slots),
      })
      patch({
        registered: true,
        device: device as SmsDevice,
        approved,
        error: null,
      })
      return approved
    } catch (err) {
      patch({ error: err instanceof Error ? err.message : 'Status check failed' })
      return false
    }
  }, [patch])

  const loadSims = useCallback(async () => {
    const slots = await getSimSlots()
    setState((prev) => ({
      ...prev,
      simSlots: slots,
      selectedSubscriptionId:
        prev.selectedSubscriptionId ?? (slots.length > 0 ? slots[0].subscriptionId : null),
    }))
    selectedSubRef.current = slots.length > 0 ? slots[0].subscriptionId : null
  }, [])

  const register = useCallback(async () => {
    patch({ busy: true, error: null })
    try {
      const slots = await getSimSlots()
      const { device, deviceKey } = await smsApi.registerDevice({
        name: `${appVersion} gateway`,
        appVersion,
        simSlots: toSimSlotInfo(slots),
      })
      await secureStorage.setDeviceKey(deviceKey)
      await secureStorage.setDeviceId(device.id)
      patch({
        registered: true,
        device,
        approved: device.status === 'approved',
        busy: false,
      })
    } catch (err) {
      patch({ busy: false, error: err instanceof Error ? err.message : 'Registration failed' })
    }
  }, [patch])

  const requestPermission = useCallback(async () => {
    const granted = await requestSendSmsPermission()
    patch({ permissionGranted: granted })
    return granted
  }, [patch])

  const selectSim = useCallback((subscriptionId: number) => {
    selectedSubRef.current = subscriptionId
    setState((prev) => ({ ...prev, selectedSubscriptionId: subscriptionId }))
  }, [])

  const runTick = useCallback(async () => {
    try {
      tickRef.current += 1
      if (tickRef.current % HEARTBEAT_EVERY_TICKS === 1) {
        const slots = await getSimSlots()
        const { device, approved } = await smsApi.heartbeat({
          appVersion,
          simSlots: toSimSlotInfo(slots),
        })
        patch({ device: device as SmsDevice, approved })
        if (!approved) return
      }

      const messages = await smsApi.claimMessages(MAX_BATCH)
      for (const message of messages) {
        try {
          await sendSms(message.toNumber, message.body, selectedSubRef.current)
          await smsApi.reportStatus(message.id, {
            status: 'sent',
            simSlot: selectedSubRef.current ?? undefined,
          })
          appendLog({
            id: message.id,
            toNumber: message.toNumber,
            status: 'sent',
            at: new Date().toISOString(),
          })
        } catch (sendErr) {
          const error = sendErr instanceof Error ? sendErr.message : 'send failed'
          await smsApi
            .reportStatus(message.id, { status: 'failed', error })
            .catch(() => undefined)
          appendLog({
            id: message.id,
            toNumber: message.toNumber,
            status: 'failed',
            at: new Date().toISOString(),
            error,
          })
        }
      }
    } catch (err) {
      patch({ error: err instanceof Error ? err.message : 'Gateway poll failed' })
    }
  }, [appendLog, patch])

  const stop = useCallback(() => {
    runningRef.current = false
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    patch({ running: false })
  }, [patch])

  const start = useCallback(async () => {
    if (runningRef.current) return
    const granted = state.permissionGranted || (await requestPermission())
    if (!granted) {
      patch({ error: 'SEND_SMS permission is required to run the gateway' })
      return
    }
    runningRef.current = true
    tickRef.current = 0
    patch({ running: true, error: null })
    await runTick()
    timerRef.current = setInterval(() => {
      void runTick()
    }, POLL_INTERVAL_MS)
  }, [patch, requestPermission, runTick, state.permissionGranted])

  // Bootstrap: restore registration + sync approval from server (heartbeat works while pending).
  useEffect(() => {
    let active = true
    void (async () => {
      const [deviceId, granted] = await Promise.all([
        secureStorage.getDeviceId(),
        hasSendSmsPermission(),
      ])
      if (!active) return
      patch({ registered: deviceId !== null, permissionGranted: granted })
      if (state.supported) {
        await loadSims()
      }
      if (deviceId !== null && active) {
        await syncStatus()
      }
    })()
    return () => {
      active = false
      if (timerRef.current) clearInterval(timerRef.current)
      if (approvalTimerRef.current) clearInterval(approvalTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // While registered but not yet approved, poll heartbeat so Start unlocks after admin approval.
  useEffect(() => {
    if (!state.registered || state.approved || state.running) {
      if (approvalTimerRef.current) {
        clearInterval(approvalTimerRef.current)
        approvalTimerRef.current = null
      }
      return
    }
    void syncStatus()
    approvalTimerRef.current = setInterval(() => {
      void syncStatus()
    }, APPROVAL_POLL_INTERVAL_MS)
    return () => {
      if (approvalTimerRef.current) {
        clearInterval(approvalTimerRef.current)
        approvalTimerRef.current = null
      }
    }
  }, [state.registered, state.approved, state.running, syncStatus])

  return {
    state,
    register,
    requestPermission,
    selectSim,
    start,
    stop,
    reloadSims: loadSims,
  }
}
