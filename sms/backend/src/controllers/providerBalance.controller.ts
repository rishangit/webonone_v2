import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import {
  getTextLkProviderBalance,
  resolveBalanceScope,
} from '../services/providerBalance.service.js'

export async function getTextLkBalance(req: AuthenticatedRequest, res: Response) {
  const resolved = resolveBalanceScope(req.user!)
  if (!resolved.ok) {
    res.status(resolved.status).json({
      message: resolved.message,
      code: resolved.code,
    })
    return
  }

  const force =
    req.query.force === '1' || req.query.force === 'true' || req.query.force === 'yes'

  const result = await getTextLkProviderBalance({
    scope: resolved.scope,
    companyId: resolved.companyId,
    force,
  })

  if (!result.ok) {
    res.status(result.status).json({
      message: result.message,
      code: result.code,
    })
    return
  }

  res.json(result.dto)
}
