import type { NextFunction, Request, Response } from 'express'
import { findDeviceByKey } from '../services/device.service.js'
import type { SmsDeviceRow } from '../models/db.js'

export interface DeviceRequest extends Request {
  device?: SmsDeviceRow
}

/**
 * Authenticates a gateway device via the `X-Sms-Device-Key` header.
 * Rejects unknown or revoked devices. Approval is enforced per-route.
 */
export async function requireDevice(req: DeviceRequest, res: Response, next: NextFunction): Promise<void> {
  const key = req.header('X-Sms-Device-Key')
  if (!key) {
    res.status(401).json({ message: 'Missing device key', code: 'UNAUTHORIZED' })
    return
  }

  try {
    const device = await findDeviceByKey(key)
    if (!device || device.status === 'revoked') {
      res.status(401).json({ message: 'Unknown or revoked device', code: 'UNAUTHORIZED' })
      return
    }
    req.device = device
    next()
  } catch {
    res.status(401).json({ message: 'Device authentication failed', code: 'UNAUTHORIZED' })
  }
}

/** Guards routes that require an already-approved device. */
export function requireApprovedDevice(req: DeviceRequest, res: Response, next: NextFunction): void {
  if (!req.device || req.device.status !== 'approved') {
    res.status(403).json({ message: 'Device is not approved', code: 'DEVICE_NOT_APPROVED' })
    return
  }
  next()
}
