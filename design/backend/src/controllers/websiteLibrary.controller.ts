import type { NextFunction, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import { getCompanyFromWebOnOne } from '../services/webononeCompanyClient.js'
import { createFontLibrarySchema } from '../schemas/websiteThemes.schema.js'
import { createFontLibraryItem, ensureStarterWebsite, listFontLibrary } from '../services/websiteLibrary.service.js'

const ensureStarterBodySchema = z.object({
  companyName: z.string().trim().min(1).max(255).optional(),
  userId: z.string().trim().min(1).max(21).nullable().optional(),
})

export async function listFontLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    res.json(await listFontLibrary({ page, pageSize, q }))
  } catch (err) {
    next(err)
  }
}

export async function createFontLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createFontLibrarySchema.parse(req.body ?? {})
    const item = await createFontLibraryItem(body)
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function ensureStarterWebsiteHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const companyId = String(req.params.companyId ?? '').trim()
    if (!companyId) throw new HttpError(400, 'Company id is required', 'COMPANY_REQUIRED')
    const body = ensureStarterBodySchema.parse(req.body ?? {})
    const companyName = body.companyName ?? (await getCompanyFromWebOnOne(companyId)).name
    const result = await ensureStarterWebsite({
      companyId,
      companyName,
      userId: body.userId ?? null,
    })
    res.status(result.created ? 201 : 200).json(result)
  } catch (err) {
    next(err)
  }
}
