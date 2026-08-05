import type { Response } from 'express'
import type { Request } from 'express'
import * as staffRepo from '../repositories/companyStaff.repository.js'

/** Internal: Design (and peers) verify whether a user is on the company staff roster. */
export async function getStaffByUserInternal(req: Request, res: Response) {
  const userId = String(req.params.userId ?? '')
  const companyId =
    typeof req.query.companyId === 'string' ? req.query.companyId.trim() : ''
  if (!userId || userId.length !== 21) {
    res.status(400).json({ message: 'Invalid user id', code: 'INVALID_USER_ID' })
    return
  }
  if (!companyId || companyId.length !== 21) {
    res.status(400).json({ message: 'companyId query is required', code: 'INVALID_COMPANY_ID' })
    return
  }

  const staff = await staffRepo.findStaffByUserId(companyId, userId)
  res.json({
    isStaff: Boolean(staff),
    staffId: staff?.id ?? null,
    displayName: staff?.display_name ?? null,
  })
}
