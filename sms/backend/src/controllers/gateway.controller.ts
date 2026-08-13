import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { DeviceScope } from '../models/db.js'
import type { TestGatewayBody, UpdateGatewayBody } from '../schemas/gateway.schema.js'
import { logAudit } from '../services/audit.service.js'
import {
  getGatewayConfig,
  getTextLkCredentials,
  upsertGatewayConfig,
} from '../services/gatewayConfig.service.js'
import { sendViaTextLk } from '../services/textLkProvider.service.js'

function resolveScope(req: AuthenticatedRequest): {
  scope: DeviceScope
  companyId: string | null
  error?: { status: number; message: string; code: string }
} {
  const user = req.user!
  if (user.role === 'super_admin') {
    return { scope: 'platform', companyId: null }
  }
  if (user.role === 'company_admin') {
    if (!user.companyId) {
      return {
        scope: 'company',
        companyId: null,
        error: { status: 400, message: 'Company admin has no company assigned', code: 'BAD_REQUEST' },
      }
    }
    return { scope: 'company', companyId: user.companyId }
  }
  return {
    scope: 'platform',
    companyId: null,
    error: { status: 403, message: 'Forbidden', code: 'FORBIDDEN' },
  }
}

export async function getGateway(req: AuthenticatedRequest, res: Response) {
  const resolved = resolveScope(req)
  if (resolved.error) {
    res.status(resolved.error.status).json({
      message: resolved.error.message,
      code: resolved.error.code,
    })
    return
  }

  const config = await getGatewayConfig(resolved.scope, resolved.companyId)
  res.json(config)
}

export async function updateGateway(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const resolved = resolveScope(req)
  if (resolved.error) {
    res.status(resolved.error.status).json({
      message: resolved.error.message,
      code: resolved.error.code,
    })
    return
  }

  const body = req.body as UpdateGatewayBody

  try {
    const config = await upsertGatewayConfig({
      scope: resolved.scope,
      companyId: resolved.companyId,
      mode: body.mode,
      senderId: body.senderId,
      apiToken: body.apiToken,
      updatedBy: user.id,
    })

    await logAudit({
      userId: user.id,
      action: 'gateway_config_update',
      entityType: 'sms_gateway_config',
      entityId: null,
      metadata: { scope: resolved.scope, companyId: resolved.companyId, mode: body.mode },
    })

    res.json(config)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save gateway config'
    res.status(400).json({ message, code: 'BAD_REQUEST' })
  }
}

export async function testGateway(req: AuthenticatedRequest, res: Response) {
  const resolved = resolveScope(req)
  if (resolved.error) {
    res.status(resolved.error.status).json({
      message: resolved.error.message,
      code: resolved.error.code,
    })
    return
  }

  const body = req.body as TestGatewayBody

  try {
    const credentials = await getTextLkCredentials(resolved.scope, resolved.companyId)
    const result = await sendViaTextLk({
      apiToken: credentials.apiToken,
      senderId: credentials.senderId,
      toNumber: body.toNumber,
      message: 'WebOnOne SMS — Text.lk gateway test message.',
    })

    if (!result.ok) {
      res.status(502).json({ message: result.error, code: 'PROVIDER_ERROR' })
      return
    }

    res.json({ ok: true, providerMessageRef: result.uid })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gateway test failed'
    res.status(400).json({ message, code: 'BAD_REQUEST' })
  }
}
