import type { NextFunction, Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { HttpError } from '../services/httpError.js'
import { getCompanyFromWebOnOne } from '../services/webononeCompanyClient.js'
import {
  createButtonLibrarySchema,
  createColorLibrarySchema,
  createFontLibrarySchema,
  createTextLibrarySchema,
  updateButtonLibraryElementSchema,
  updateTextLibraryElementSchema,
} from '../schemas/websiteThemes.schema.js'
import {
  createButtonLibraryItem,
  createColorLibraryItem,
  createFontLibraryItem,
  createTextLibraryItem,
  deleteButtonLibraryItem,
  deleteColorLibraryItem,
  deleteFontLibraryItem,
  deleteTextLibraryItem,
  ensureStarterWebsite,
  getButtonLibraryItem,
  getTextLibraryItem,
  listButtonLibrary,
  listColorLibrary,
  listFontLibrary,
  listTextLibrary,
  patchButtonLibraryItem,
  patchTextLibraryItem,
  updateButtonLibraryItem,
  updateColorLibraryItem,
  updateFontLibraryItem,
  updateTextLibraryItem,
} from '../services/websiteLibrary.service.js'
import { readNamesQuery } from '../utils/namesQuery.js'

function publishedOnly(req: AuthenticatedRequest): boolean {
  const requested = req.query.publishedOnly === '1' || req.query.publishedOnly === 'true'
  return req.user?.role !== 'super_admin' || requested
}

const ensureStarterBodySchema = z.object({
  companyName: z.string().trim().min(1).max(255).optional(),
  userId: z.string().trim().min(1).max(21).nullable().optional(),
})

export async function listFontLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const names = readNamesQuery(req.query.names)
    res.json(await listFontLibrary({ page, pageSize, q, names, publishedOnly: publishedOnly(req) }))
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

export async function deleteFontLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteFontLibraryItem(String(req.params.id ?? ''))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function updateFontLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createFontLibrarySchema.parse(req.body ?? {})
    const item = await updateFontLibraryItem(String(req.params.id ?? ''), body)
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function listColorLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const names = readNamesQuery(req.query.names)
    res.json(await listColorLibrary({ page, pageSize, q, names, publishedOnly: publishedOnly(req) }))
  } catch (err) {
    next(err)
  }
}

export async function createColorLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createColorLibrarySchema.parse(req.body ?? {})
    const item = await createColorLibraryItem(body)
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteColorLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteColorLibraryItem(String(req.params.id ?? ''))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function updateColorLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createColorLibrarySchema.parse(req.body ?? {})
    const item = await updateColorLibraryItem(String(req.params.id ?? ''), body)
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function listTextLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const names = readNamesQuery(req.query.names)
    res.json(await listTextLibrary({ page, pageSize, q, names, publishedOnly: publishedOnly(req) }))
  } catch (err) {
    next(err)
  }
}

export async function createTextLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createTextLibrarySchema.parse(req.body ?? {})
    const item = await createTextLibraryItem(body)
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteTextLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteTextLibraryItem(String(req.params.id ?? ''))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function getTextLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await getTextLibraryItem(String(req.params.id ?? ''))
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateTextLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id ?? '')
    const full = createTextLibrarySchema.safeParse(req.body ?? {})
    const item = full.success
      ? await updateTextLibraryItem(id, full.data)
      : await patchTextLibraryItem(id, updateTextLibraryElementSchema.parse(req.body ?? {}))
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function listButtonLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const names = readNamesQuery(req.query.names)
    res.json(await listButtonLibrary({ page, pageSize, q, names, publishedOnly: publishedOnly(req) }))
  } catch (err) {
    next(err)
  }
}

export async function createButtonLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = createButtonLibrarySchema.parse(req.body ?? {})
    const item = await createButtonLibraryItem(body)
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
}

export async function deleteButtonLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await deleteButtonLibraryItem(String(req.params.id ?? ''))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function getButtonLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await getButtonLibraryItem(String(req.params.id ?? ''))
    res.json({ item })
  } catch (err) {
    next(err)
  }
}

export async function updateButtonLibraryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id ?? '')
    const full = createButtonLibrarySchema.safeParse(req.body ?? {})
    const item = full.success
      ? await updateButtonLibraryItem(id, full.data)
      : await patchButtonLibraryItem(id, updateButtonLibraryElementSchema.parse(req.body ?? {}))
    res.json({ item })
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
