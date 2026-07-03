import type { Request, Response } from 'express'
import type { SyncUserRoleBody } from '../schemas/internal.schema.js'
import { upsertUserRole } from '../services/user.service.js'

export async function internalSyncUserRole(req: Request, res: Response) {
  const body = req.body as SyncUserRoleBody
  const result = await upsertUserRole({
    userId: body.userId,
    role: body.role,
    companyId: body.companyId ?? null,
  })
  res.json({ status: 'ok', ...result })
}
