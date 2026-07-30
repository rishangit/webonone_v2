import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import {
  purgeOrphanCompanies,
  upsertCompany,
  upsertCompanySchema,
} from '../services/company.service.js'
import { generateAllDueInvoices } from '../services/invoice.service.js'
import { z } from 'zod'

export async function upsertCompanyHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = upsertCompanySchema.parse(req.body)
    const company = await upsertCompany(body)
    res.json({ company })
  } catch (err) {
    next(err)
  }
}

const purgeOrphansSchema = z.object({
  keepCompanyIds: z.array(z.string().min(1).max(21)),
})

export async function purgeOrphanCompaniesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = purgeOrphansSchema.parse(req.body ?? {})
    const result = await purgeOrphanCompanies(body.keepCompanyIds)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const generateSchema = z.object({
  companyId: z.string().min(1).max(21).optional(),
})

export async function generateInvoicesHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = generateSchema.parse(req.body ?? {})
    const result = await generateAllDueInvoices(body.companyId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
