import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { logAudit } from '../services/audit.service.js'
import { getDeviceById, listDevices, setDeviceStatus } from '../services/device.service.js'

export async function getDevices(req: AuthenticatedRequest, res: Response) {
  const items = await listDevices({ role: req.user?.role, companyId: req.user?.companyId })
  res.json({ items })
}

/** Company admins may only manage devices scoped to their own company. */
async function assertManageAccess(req: AuthenticatedRequest, deviceId: string) {
  const device = await getDeviceById(deviceId)
  if (!device) return { error: 'NOT_FOUND' as const }
  const user = req.user!
  if (user.role === 'super_admin') return { device }
  if (user.role === 'company_admin' && device.scope === 'company' && device.company_id === user.companyId) {
    return { device }
  }
  return { error: 'FORBIDDEN' as const }
}

export async function approveDevice(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const access = await assertManageAccess(req, id)
  if (access.error === 'NOT_FOUND') {
    res.status(404).json({ message: 'Device not found', code: 'NOT_FOUND' })
    return
  }
  if (access.error === 'FORBIDDEN') {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }

  const device = await setDeviceStatus(id, 'approved')
  await logAudit({ userId: req.user?.id, action: 'device_approve', entityType: 'sms_device', entityId: id })
  res.json({ device })
}

export async function revokeDevice(req: AuthenticatedRequest, res: Response) {
  const id = String(req.params.id)
  const access = await assertManageAccess(req, id)
  if (access.error === 'NOT_FOUND') {
    res.status(404).json({ message: 'Device not found', code: 'NOT_FOUND' })
    return
  }
  if (access.error === 'FORBIDDEN') {
    res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' })
    return
  }

  const device = await setDeviceStatus(id, 'revoked')
  await logAudit({ userId: req.user?.id, action: 'device_revoke', entityType: 'sms_device', entityId: id })
  res.json({ device })
}
