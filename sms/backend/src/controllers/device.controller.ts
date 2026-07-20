import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { DeviceRequest } from '../middleware/deviceAuth.js'
import type { DeviceScope } from '../models/db.js'
import type {
  DeviceMessagesQuery,
  DeviceStatusBody,
  HeartbeatBody,
  RegisterDeviceBody,
} from '../schemas/device.schema.js'
import { logAudit } from '../services/audit.service.js'
import { heartbeat, registerDevice } from '../services/device.service.js'
import { claimMessagesForDevice, reportStatus } from '../services/queue.service.js'

/** Register the caller's phone as a gateway device. Scope is derived from the JWT role. */
export async function register(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  if (user.role !== 'super_admin' && user.role !== 'company_admin') {
    res.status(403).json({ message: 'Only admins can register a gateway device', code: 'FORBIDDEN' })
    return
  }

  const scope: DeviceScope = user.role === 'super_admin' ? 'platform' : 'company'
  const companyId = scope === 'company' ? user.companyId : null
  if (scope === 'company' && !companyId) {
    res.status(400).json({ message: 'Company admin has no company assigned', code: 'BAD_REQUEST' })
    return
  }

  const body = req.body as RegisterDeviceBody
  const { device, deviceKey } = await registerDevice({
    name: body.name,
    ownerUserId: user.id,
    scope,
    companyId,
    simSlots: body.simSlots,
    appVersion: body.appVersion,
  })

  await logAudit({
    userId: user.id,
    action: 'device_register',
    entityType: 'sms_device',
    entityId: device.id,
    metadata: { scope, companyId },
  })

  // deviceKey is returned exactly once; only its hash is stored.
  res.status(201).json({ device, deviceKey })
}

export async function heartbeatHandler(req: DeviceRequest, res: Response) {
  const body = req.body as HeartbeatBody
  const device = await heartbeat(req.device!.id, { appVersion: body.appVersion, simSlots: body.simSlots })
  res.json({ device, approved: device.status === 'approved' })
}

export async function getMessages(req: DeviceRequest, res: Response) {
  const query = req.query as unknown as DeviceMessagesQuery
  const messages = await claimMessagesForDevice(req.device!, query.max ?? 5)
  res.json({ messages })
}

export async function postStatus(req: DeviceRequest, res: Response) {
  const id = String(req.params.id)
  const body = req.body as DeviceStatusBody
  try {
    await reportStatus(id, req.device!.id, body)
    res.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Status update failed'
    res.status(400).json({ message, code: 'BAD_REQUEST' })
  }
}
